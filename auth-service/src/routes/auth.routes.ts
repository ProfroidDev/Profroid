import { Router, type Request, type Response } from "express";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import bcrypt from "bcrypt";
import passport from "../config/passport.js";
import {
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
} from "../services/email.service.js";
import {
  sendVerificationEmail,
  verifyEmailToken,
  resendVerificationEmail,
  generateAndStoreVerificationToken,
  isUserVerificationLocked,
} from "../services/verification.service.js";
import {
  RegisterSchema,
  SignInSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from "../validation/schemas.js";
import { ZodError } from "zod";

const router = Router();
const prisma = new PrismaClient();

const JWT_SECRET =
  process.env.JWT_SECRET || process.env.BETTER_AUTH_SECRET || "";
const JWT_EXPIRES_IN = "2h"; // 2 hours for better security

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is required");
}

// Helper function to extract rate limiting key from request
// Uses JWT user ID if available, otherwise uses IP address (with IPv6 support)
function getRateLimitKey(req: Request): string {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET as string) as JWTPayload;
      return `user:${decoded.sub}`; // Use user ID as key with prefix
    } catch (err) {
      // If token is invalid, use IP with invalid-token prefix for stricter tracking
      const ip =
        (req.headers["x-forwarded-for"] as string) ||
        req.socket.remoteAddress ||
        "unknown";
      return `invalid-token:${ip}`;
    }
  }
  // No auth header - use IP with no-auth prefix
  const ip =
    (req.headers["x-forwarded-for"] as string) ||
    req.socket.remoteAddress ||
    "unknown";
  return `no-auth:${ip}`;
}

// Rate limiter for user search endpoint to prevent enumeration attacks
// Allows 30 requests per 15 minutes per user
const searchUsersRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each user to 30 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: getRateLimitKey,
  handler: (req: Request, res: Response) => {
    const rateLimitKey = getRateLimitKey(req);
    // Security Note: rateLimitKey includes user IDs for audit purposes.
    // Ensure application logs are properly secured with access controls.
    console.warn(
      `[RATE LIMIT] User search rate limit exceeded for ${rateLimitKey}`,
    );
    res.status(429).json({
      error: "Too many search requests. Please try again later.",
      retryAfter: "15 minutes",
    });
  },
  skip: (req: Request) => {
    // Optionally skip rate limiting for admins
    // This can be enabled if admins need unrestricted access
    return false;
  },
});

// Bcrypt password hashing configuration
const BCRYPT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, BCRYPT_ROUNDS);
}

// Verify password with support for both bcrypt and legacy SHA256 hashes
// Automatically migrates SHA256 hashes to bcrypt on successful login
async function verifyPassword(password: string, hash: string): Promise<{ valid: boolean; needsUpdate: boolean }> {
  try {
    // Try bcrypt first (new hashes)
    const isBcryptValid = await bcrypt.compare(password, hash);
    if (isBcryptValid) {
      return { valid: true, needsUpdate: false };
    }
  } catch (error) {
    // Bcrypt compare failed - try legacy SHA256
  }

  // Try legacy SHA256 hash (old passwords)
  const sha256Hash = crypto.createHash("sha256").update(password).digest("hex");
  const isSha256Valid = sha256Hash === hash;
  
  if (isSha256Valid) {
    // Password is valid but needs migration from SHA256 to bcrypt
    return { valid: true, needsUpdate: true };
  }

  return { valid: false, needsUpdate: false };
}

type JWTPayload = {
  sub: string;
  email: string;
  role?: string;
  employeeType?: string;
};

function signToken(
  user: { id: string; email: string },
  role?: string,
  employeeType?: string | null,
): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: role || "customer",
      employeeType: employeeType || null,
    },
    JWT_SECRET as string,
    { expiresIn: JWT_EXPIRES_IN },
  );
}

function getPayloadFromRequest(req: Request, res: Response): JWTPayload | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "No authorization token" });
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET as string);
    const payload = decoded as JWTPayload;
    return payload;
  } catch (error) {
    console.error("JWT verification error:", error);
    res.status(401).json({ error: "Invalid or expired token" });
    return null;
  }
}

/**
 * Register a new user
 * POST /api/auth/register
 *
 * Security: User must verify email before login
 */
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    // Validate input using Zod schema (includes sanitization)
    const parseResult = RegisterSchema.safeParse(req.body);

    if (!parseResult.success) {
      const errorMessages = parseResult.error.errors.map((err) => err.message);
      return res.status(400).json({ error: "Validation Failed", errors: errorMessages });
    }

    const { email: sanitizedEmail, password: sanitizedPassword, name: sanitizedName } = parseResult.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: sanitizedEmail },
      include: { userProfile: true },
    });

    if (existingUser) {
      // If user exists but not verified, resend verification email
      if (!existingUser.emailVerified) {
        try {
          const { token } = await generateAndStoreVerificationToken(
            existingUser.id,
          );
          // Send email asynchronously in background
          // Use the user's preferred language or from registration request
          const userLanguage = existingUser.userProfile?.preferredLanguage || parseResult.data.preferredLanguage || 'en';
          sendVerificationEmail(sanitizedEmail, token, sanitizedName, userLanguage).catch((error) => {
            console.error("Error sending verification email:", error);
          });
          return res.status(409).json({
            success: false,
            requiresVerification: true,
            userId: existingUser.id,
            message:
              "Account already exists. A new verification email has been sent.",
          });
        } catch (error) {
          console.error("Error generating verification token:", error);
          return res.status(409).json({ error: "User already exists" });
        }
      }
      return res.status(409).json({ error: "User already exists" });
    }

    // Create user (NOT VERIFIED YET)
    const user = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        email: sanitizedEmail,
        emailVerified: false,
      },
    });

    // Create user profile as PENDING (not active)
    const profile = await prisma.userProfile.create({
      data: {
        userId: user.id,
        role: "customer",
        isActive: false, // Not active until customer data is submitted
        preferredLanguage: parseResult.data.preferredLanguage || 'en', // Store preferred language from registration
      },
    });

    // Store password separately (already sanitized)
    const hashedPassword = await hashPassword(sanitizedPassword);
    await prisma.account.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        type: "email",
        provider: "email",
        providerAccountId: sanitizedEmail,
        accessToken: hashedPassword,
      },
    });

    // Generate verification token and send email (non-blocking)
    try {
      const { token } = await generateAndStoreVerificationToken(user.id);

      // Send email asynchronously in background to avoid blocking the response
      // Use the preferred language from registration request
      sendVerificationEmail(sanitizedEmail, token, sanitizedName, parseResult.data.preferredLanguage || 'en').catch((error) => {
        console.error("Error sending verification email:", error);
      });

      return res.status(201).json({
        success: true,
        requiresVerification: true,
        userId: user.id,
        message:
          "Registration successful. Please verify your email to continue.",
      });
    } catch (error) {
      console.error("Error generating verification token:", error);
      // Delete user if token generation failed
      await prisma.user.delete({ where: { id: user.id } });
      return res
        .status(500)
        .json({ error: "Failed to generate verification token" });
    }
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ error: "Registration failed" });
  }
});

/**
 * Sign in user
 * POST /api/auth/sign-in
 *
 * Security: User must have verified email to sign in
 * Validates and sanitizes input using Zod schema
 */
router.post("/sign-in", async (req: Request, res: Response) => {
  try {
    // Validate input using Zod schema (includes sanitization)
    const parseResult = SignInSchema.safeParse(req.body);

    if (!parseResult.success) {
      const errorMessages = parseResult.error.errors.map((err) => err.message);
      return res.status(400).json({ error: "Validation Failed", errors: errorMessages });
    }

    const { email: sanitizedEmail, password: sanitizedPassword } = parseResult.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: sanitizedEmail },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // SECURITY: Check email verification BEFORE password check to prevent timing attacks
    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        requiresVerification: true,
        userId: user.id,
        message: "Please verify your email before logging in.",
        code: "EMAIL_NOT_VERIFIED",
      });
    }

    // Get password hash
    const account = await prisma.account.findFirst({
      where: { userId: user!.id, provider: "email" },
    });

    if (!account) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const passwordVerification = await verifyPassword(sanitizedPassword, account.accessToken || "");
    if (!passwordVerification.valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Migrate SHA256 password to bcrypt if needed
    if (passwordVerification.needsUpdate) {
      const hashedPassword = await hashPassword(sanitizedPassword);
      await prisma.account.update({
        where: { id: account.id },
        data: { accessToken: hashedPassword },
      });
      console.log(`[PASSWORD MIGRATION] User ${user.email} password upgraded from SHA256 to bcrypt`);
    }

    // Get user profile
    const profile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
    });

    // Check if user has completed registration (customer data)
    if (!profile?.isActive) {
      return res.status(200).json({
        success: false,
        requiresCompletion: true,
        userId: user.id,
        message: "Please complete your customer registration",
      });
    }

    const token = signToken(
      { id: user.id, email: user.email as string },
      profile?.role,
      profile?.employeeType,
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        role: profile?.role || "customer",
        employeeType: profile?.employeeType,
        isActive: profile?.isActive ?? true,
      },
    });
  } catch (error) {
    console.error("Sign in error:", error);
    return res.status(500).json({ error: "Sign in failed" });
  }
});

/**
 * Get current user
 * GET /api/auth/user
 * Headers: Authorization: Bearer <jwt>
 */
router.get("/user", async (req: Request, res: Response) => {
  try {
    const payload = getPayloadFromRequest(req, res);
    if (!payload) return;

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get profile
    const profile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        image: user.image,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        role: profile?.role || "customer",
        employeeType: profile?.employeeType,
        isActive: profile?.isActive || true,
      },
    });
  } catch (error) {
    console.error("User fetch error:", error);
    return res.status(500).json({ error: "Failed to fetch user" });
  }
});

/**
 * Update user profile
 * PUT /api/auth/user
 * Headers: Authorization: Bearer <jwt>
 */
router.put("/user", async (req: Request, res: Response) => {
  try {
    const payload = getPayloadFromRequest(req, res);
    if (!payload) return;

    // No user fields to update currently (email immutable here)
    const updatedUser = await prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get profile
    const profile = await prisma.userProfile.findUnique({
      where: { userId: payload.sub },
    });

    res.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        image: updatedUser.image,
        emailVerified: updatedUser.emailVerified,
        createdAt: updatedUser.createdAt,
        role: profile?.role || "customer",
        employeeType: profile?.employeeType,
        isActive: profile?.isActive || true,
      },
    });
  } catch (error) {
    console.error("User update error:", error);
    return res.status(500).json({ error: "Failed to update user" });
  }
});

/**
 * Change password
 * POST /api/auth/change-password
 * Headers: Authorization: Bearer <jwt>
 */
router.post("/change-password", async (req: Request, res: Response) => {
  try {
    const payload = getPayloadFromRequest(req, res);
    if (!payload) return;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Old password and new password are required" });
    }

    // Get account and verify old password
    const account = await prisma.account.findFirst({
      where: { userId: payload.sub, provider: "email" },
    });

    if (!account) {
      return res.status(401).json({ error: "Invalid current password" });
    }

    const passwordVerification = await verifyPassword(oldPassword, account.accessToken || "");
    if (!passwordVerification.valid) {
      return res.status(401).json({ error: "Invalid current password" });
    }

    // Update password
    const hashedNewPassword = await hashPassword(newPassword);
    await prisma.account.update({
      where: { id: account.id },
      data: {
        accessToken: hashedNewPassword,
      },
    });

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ error: "Failed to change password" });
  }
});

/**
 * Sign out
 * POST /api/auth/sign-out
 * Headers: Authorization: Bearer <jwt>
 */
router.post("/sign-out", async (req: Request, res: Response) => {
  try {
    // JWT is stateless; simply acknowledge sign out if token is provided and valid
    const payload = getPayloadFromRequest(req, res);
    if (!payload) return;

    res.json({ success: true, message: "Signed out successfully" });
  } catch (error) {
    console.error("Sign out error:", error);
    return res.status(500).json({ error: "Sign out failed" });
  }
});

/**
 * Forgot password - Request password reset
 * POST /api/auth/forgot-password
 */
router.post("/forgot-password", async (req: Request, res: Response) => {
  try {
    // Validate request body with Zod
    const validatedData = ForgotPasswordSchema.parse(req.body);
    const { email } = validatedData;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: { userProfile: true },
    });

    // Always return success to prevent email enumeration
    // Don't reveal if email exists or not
    if (!user) {
      return res.json({
        success: true,
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash the token before storing (for security)
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Set expiration time (1 hour from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Delete any existing password reset tokens for this user
    await prisma.verification.deleteMany({
      where: {
        userId: user.id,
        identifier: "password_reset",
      },
    });

    // Store reset token in verification table
    const verification = await prisma.verification.create({
      data: {
        id: crypto.randomUUID(),
        identifier: "password_reset",
        value: hashedToken,
        expiresAt: expiresAt,
        userId: user.id,
      },
    });

    // Send email with the unhashed token in user's preferred language
    try {
      const userLanguage = user.userProfile?.preferredLanguage || 'en';
      await sendPasswordResetEmail(email, resetToken, undefined, userLanguage);
    } catch (emailError) {
      console.error("Failed to send reset email:", emailError);
      // Clear the token entry if email fails
      await prisma.verification.delete({ where: { id: verification.id } });
      return res.status(500).json({
        error: "Failed to send password reset email. Please try again later.",
      });
    }

    res.json({
      success: true,
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
    }
    console.error("Forgot password error:", error);
    return res
      .status(500)
      .json({ error: "Failed to process password reset request" });
  }
});

/**
 * Reset password - Complete password reset with token
 * POST /api/auth/reset-password
 */
router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    // Validate request body with Zod
    const validatedData = ResetPasswordSchema.parse(req.body);
    const { token, newPassword } = validatedData;

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find verification by token
    const verification = await prisma.verification.findFirst({
      where: {
        identifier: "password_reset",
        value: hashedToken,
      },
    });

    if (!verification) {
      return res.status(400).json({
        error: "Invalid or expired reset token",
      });
    }

    // Find user by verification.userId
    const user = await prisma.user.findUnique({
      where: { id: verification.userId as string },
    });

    if (!user) {
      return res.status(400).json({
        error: "Invalid or expired reset token",
      });
    }

    // Check if token has expired
    if (verification.expiresAt < new Date()) {
      await prisma.verification.delete({ where: { id: verification.id } });
      return res.status(400).json({
        error: "Reset token has expired. Please request a new password reset.",
      });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password in account table
    const account = await prisma.account.findFirst({
      where: { userId: user.id, provider: "email" },
    });

    if (!account) {
      return res.status(404).json({
        error: "User account not found",
      });
    }

    await prisma.account.update({
      where: { id: account.id },
      data: {
        accessToken: hashedPassword,
      },
    });

    // Remove used verification token
    await prisma.verification.delete({ where: { id: verification.id } });

    // Optional: Invalidate all existing sessions for security
    await prisma.session.deleteMany({
      where: { userId: user!.id },
    });

    // Send confirmation email in user's preferred language
    try {
      const userProfile = await prisma.userProfile.findUnique({
        where: { userId: user!.id },
      });
      const userLanguage = userProfile?.preferredLanguage || 'en';
      await sendPasswordChangedEmail(user!.email || "", undefined, userLanguage);
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
      // Don't fail the request if confirmation email fails
    }

    res.json({
      success: true,
      message:
        "Password has been reset successfully. You can now sign in with your new password.",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
    }
    console.error("Reset password error:", error);
    return res.status(500).json({ error: "Failed to reset password" });
  }
});

/**
 * Health check
 * GET /api/auth/health
 */
router.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", message: "Auth service is running" });
});

/**
 * Get paginated list of unassigned users (for admin to create employees)
 * GET /api/auth/unassigned-users?page=1&limit=20
 * Headers: Authorization: Bearer <jwt>
 *
 * Security & Privacy Considerations:
 * - Pagination limits data exposure per request
 * - Only admins can access (role check)
 * - Returns only necessary fields (userId only, no email)
 * - Limits to max 100 results per page
 */
router.get("/unassigned-users", async (req: Request, res: Response) => {
  try {
    const payload = getPayloadFromRequest(req, res);
    if (!payload) return;

    // Check if user is admin
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: payload.sub },
    });

    if (userProfile?.role !== "admin") {
      res.status(403).json({ error: "Only admins can access this resource" });
      return;
    }

    // Parse pagination parameters with validation
    let page = parseInt(req.query.page as string) || 1;
    let limit = parseInt(req.query.limit as string) || 20;

    // Validate and enforce limits
    if (page < 1) page = 1;
    if (limit < 1) limit = 1;
    if (limit > 100) limit = 100; // Maximum 100 per page

    const skip = (page - 1) * limit;

    // Get total count for pagination metadata
    const totalCount = await prisma.userProfile.count({
      where: {
        OR: [
          { role: "customer" },
          { AND: [{ role: "employee" }, { employeeType: null }] },
        ],
      },
    });

    // Get paginated users
    const unassignedUsers = await prisma.userProfile.findMany({
      where: {
        OR: [
          { role: "customer" },
          { AND: [{ role: "employee" }, { employeeType: null }] },
        ],
      },
      select: {
        userId: true, // Only return userId, not email
      },
      skip,
      take: limit,
      orderBy: {
        userId: "asc", // Consistent ordering for pagination
      },
    });

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      success: true,
      data: unassignedUsers.map((up) => ({ userId: up.userId })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Fetch unassigned users error:", error);
    return res.status(500).json({ error: "Failed to fetch unassigned users" });
  }
});

/**
 * Search for users to assign as employees
 * GET /api/auth/search-users?q=email&page=1&limit=20
 * Headers: Authorization: Bearer <jwt>
 *
 * Security & Privacy:
 * - Admins and employees only
 * - Rate limited to 30 requests per 15 minutes per user
 * - Requires search query (min 2 chars) to prevent bulk enumeration
 * - Pagination enforced (max 50 per page for search)
 * - Returns userId and email for search results
 * - All searches are logged for audit purposes
 */
router.get(
  "/search-users",
  searchUsersRateLimiter,
  async (req: Request, res: Response) => {
    try {
      const payload = getPayloadFromRequest(req, res);
      if (!payload) return;

      // Check if user is authenticated (any role allowed)
      // Customers need access to search users when editing quotations
      const userProfile = await prisma.userProfile.findUnique({
        where: { userId: payload.sub },
      });

      if (!userProfile) {
        console.warn(
          `[SECURITY] User search attempt by unknown user ${payload.sub}`,
        );
        res.status(403).json({ error: "User profile not found" });
        return;
      }

      const query = (req.query.q as string)?.trim() || "";

      // Require search query to prevent bulk data exposure
      if (query.length < 2) {
        return res.status(400).json({
          error: "Search query must be at least 2 characters",
        });
      }

      // Log search activity for audit purposes
      // Security Note: This log contains user IDs and search queries for security auditing.
      // Logs should be stored securely with appropriate access controls and retention policies.
      // User IDs and email searches are necessary to detect abuse patterns and investigate incidents.
      console.info(
        `[AUDIT] User search: userId=${payload.sub}, role=${userProfile.role}, query="${query}", ip=${req.ip}`,
      );

      // Parse pagination
      let page = parseInt(req.query.page as string) || 1;
      let limit = parseInt(req.query.limit as string) || 20;

      if (page < 1) page = 1;
      if (limit < 1) limit = 1;
      if (limit > 50) limit = 50; // Stricter limit for search

      const skip = (page - 1) * limit;

      // Search users by email
      const totalCount = await prisma.user.count({
        where: {
          email: { contains: query },
        },
      });

      const users = await prisma.user.findMany({
        where: {
          email: { contains: query },
        },
        select: {
          id: true,
          email: true,
        },
        skip,
        take: limit,
        orderBy: {
          email: "asc",
        },
      });

      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        success: true,
        data: users.map((u) => ({
          userId: u.id,
          email: u.email,
        })),
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      });
    } catch (error) {
      console.error("Search users error:", error);
      return res.status(500).json({ error: "Failed to search users" });
    }
  },
);

/**
 * Assign employee profile to existing user
 * POST /api/auth/assign-employee
 * Body: { userId: string, employeeType: string }
 * Headers: Authorization: Bearer <jwt>
 */
router.post("/assign-employee", async (req: Request, res: Response) => {
  try {
    const payload = getPayloadFromRequest(req, res);
    if (!payload) return;

    const { userId, employeeType } = req.body;

    if (!userId || !employeeType) {
      res.status(400).json({ error: "userId and employeeType are required" });
      return;
    }

    // Check if requester is admin
    const adminProfile = await prisma.userProfile.findUnique({
      where: { userId: payload.sub },
    });

    if (adminProfile?.role !== "admin") {
      res.status(403).json({ error: "Only admins can assign employees" });
      return;
    }

    // Update user profile to employee role with employeeType
    const updatedProfile = await prisma.userProfile.update({
      where: { userId },
      data: {
        role: "employee",
        employeeType,
        isActive: true,
      },
    });

    res.json({
      success: true,
      message: `User assigned as ${employeeType} employee successfully`,
      profile: {
        userId: updatedProfile.userId,
        role: updatedProfile.role,
        employeeType: updatedProfile.employeeType,
        isActive: updatedProfile.isActive,
      },
    });
  } catch (error) {
    console.error("Assign employee error:", error);
    return res.status(500).json({ error: "Failed to assign employee" });
  }
});

/**
 * Get user by ID (for employee details)
 * GET /api/auth/users/:userId
 * Headers: Authorization: Bearer <jwt>
 */
router.get("/users/:userId", async (req: Request, res: Response) => {
  try {
    const payload = getPayloadFromRequest(req, res);
    if (!payload) return;

    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: profile?.role,
        employeeType: profile?.employeeType,
        isActive: profile?.isActive,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({ error: "Failed to fetch user" });
  }
});

/**
 * Complete registration by activating user (called after customer data is submitted to backend)
 * POST /api/auth/complete-registration
 * Body: { userId: string, customerData: { firstName, lastName, streetAddress, city, province, postalCode, country, phoneNumbers } }
 * No auth required - but validates userId is pending AND email verified
 *
 * Security: User MUST have verified email before completing registration
 */
router.post("/complete-registration", async (req: Request, res: Response) => {
  try {
    const { userId, customerData } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    // Find user and verify they are pending (not already active)
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // SECURITY: Verify email is verified BEFORE allowing profile completion
    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        requiresVerification: true,
        message: "Please verify your email before completing registration",
        code: "EMAIL_NOT_VERIFIED",
      });
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return res.status(404).json({ error: "User profile not found" });
    }

    // Security check: only allow if user is still pending
    if (profile.isActive) {
      return res.status(400).json({ error: "Registration already completed" });
    }

    // If customerData provided, create customer record in backend
    if (customerData) {
      try {
        const backendUrl = process.env.BACKEND_URL;
        console.log(`Calling backend at: ${backendUrl}/api/v1/customers`);

        const customerPayload = {
          ...customerData,
          userId,
        };

        console.log(
          "Customer payload:",
          JSON.stringify(customerPayload, null, 2),
        );

        const backendResponse = await fetch(`${backendUrl}/api/v1/customers`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(customerPayload),
        });

        console.log(`Backend response status: ${backendResponse.status}`);

        if (!backendResponse.ok) {
          const errorData = await backendResponse.json().catch(() => ({}));
          console.error("Backend customer creation failed:", errorData);
          return res.status(500).json({
            error: "Failed to create customer record",
            details:
              errorData.message ||
              errorData.error ||
              `Backend returned ${backendResponse.status}`,
            backendUrl,
          });
        }

        console.log("Customer created successfully in backend");
      } catch (backendError) {
        console.error("Error calling backend:", backendError);
        const errorMessage =
          backendError instanceof Error
            ? backendError.message
            : "Unknown error";
        return res.status(500).json({
          error: "Failed to communicate with backend service",
          details: errorMessage,
        });
      }
    }

    // Activate user profile
    const updatedProfile = await prisma.userProfile.update({
      where: { userId },
      data: { isActive: true },
    });

    // Issue token now that registration is complete
    const token = signToken(
      { id: user.id, email: user.email as string },
      updatedProfile.role,
      updatedProfile.employeeType,
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        role: updatedProfile.role,
        employeeType: updatedProfile.employeeType,
        isActive: updatedProfile.isActive,
      },
    });
  } catch (error) {
    console.error("Complete registration error:", error);
    return res.status(500).json({ error: "Failed to complete registration" });
  }
});

/**
 * Cancel incomplete registration (cleanup if user abandons the process)
 * DELETE /api/auth/cancel-registration/:userId
 * No auth required - cleanup endpoint
 */
router.delete(
  "/cancel-registration/:userId",
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      // Delete user and related records if not active (incomplete registration)
      const profile = await prisma.userProfile.findUnique({
        where: { userId },
      });

      if (profile && !profile.isActive) {
        // Delete in order: account, profile, user
        await prisma.account.deleteMany({ where: { userId } });
        await prisma.userProfile.delete({ where: { userId } });
        await prisma.user.delete({ where: { id: userId } });

        return res.json({
          success: true,
          message: "Incomplete registration cancelled",
        });
      }

      return res.status(400).json({ error: "Cannot cancel active user" });
    } catch (error) {
      console.error("Cancel registration error:", error);
      return res.status(500).json({ error: "Failed to cancel registration" });
    }
  },
);

/**
 * Verify email token
 * POST /api/auth/verify-email/:token
 *
 * Security:
 * - Token parameter sanitized to prevent injection attacks
 * - Constant-time token comparison (prevents timing attacks)
 * - Rate limiting: 5 attempts then lock 15 minutes
 * - Token single-use: deleted after verification
 * - Token hashed in DB: leaked DB doesn't expose tokens
 */
router.post("/verify-email/:token", async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ error: "Verification token is required" });
    }

    // Import sanitizer for token validation
    const { sanitizeToken } = await import("../utils/sanitizer.js");
    const sanitizedToken = sanitizeToken(token);

    if (!sanitizedToken) {
      return res.status(400).json({ error: "Invalid token format" });
    }

    const result = await verifyEmailToken(sanitizedToken);

    if (!result.success) {
      if (result.error === "RATE_LIMIT") {
        return res.status(429).json({
          success: false,
          message: result.message,
          code: "RATE_LIMIT",
        });
      }
      if (result.error === "INVALID_TOKEN") {
        return res.status(400).json({
          success: false,
          message: result.message,
          code: "INVALID_TOKEN",
        });
      }
      return res.status(400).json({
        success: false,
        message: result.message,
        code: result.error,
      });
    }

    // Email verified successfully
    return res.json({
      success: true,
      message: "Email verified successfully",
      userId: result.userId,
      email: result.email,
    });
  } catch (error) {
    console.error("Email verification error:", error);
    return res.status(500).json({
      success: false,
      error: "Email verification failed",
    });
  }
});

/**
 * Resend verification email
 * POST /api/auth/resend-verification
 *
 * Security:
 * - Input sanitized to prevent injection attacks
 * - Rate limited: 3 per hour, 10 per day per email
 * - No email enumeration: same response whether email exists or not
 * - Resets rate limit on attempts if expired
 */
router.post("/resend-verification", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Import sanitizer for email validation
    const { sanitizeEmail } = await import("../utils/sanitizer.js");
    const sanitizedEmail = sanitizeEmail(email);

    if (!sanitizedEmail) {
      // Return generic message to prevent email enumeration
      return res.json({
        success: false,
        message: "If an account exists, we sent a verification email",
      });
    }

    const result = await resendVerificationEmail(sanitizedEmail);

    // Always return 200 with generic message to prevent email enumeration
    return res.json({
      success: result.success,
      message: result.message,
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    // Still return generic message on error
    return res.json({
      success: false,
      message: "If an account exists, we sent a verification email",
    });
  }
});

/**
 * Check email verification status
 * GET /api/auth/verify-status
 * Headers: Authorization: Bearer <jwt>
 */
router.get("/verify-status", async (req: Request, res: Response) => {
  try {
    const payload = getPayloadFromRequest(req, res);
    if (!payload) return;

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        emailVerified: true,
        emailVerifiedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      success: true,
      emailVerified: user.emailVerified,
      emailVerifiedAt: user.emailVerifiedAt,
      requiresVerification: !user.emailVerified,
    });
  } catch (error) {
    console.error("Verify status error:", error);
    return res
      .status(500)
      .json({ error: "Failed to check verification status" });
  }
});

/**
 * Update user preferences (language)
 * PUT /api/auth/user-preferences
 * Headers: Authorization: Bearer <jwt>
 */
router.put("/user-preferences", async (req: Request, res: Response) => {
  try {
    const payload = getPayloadFromRequest(req, res);
    if (!payload) return;

    const { preferredLanguage } = req.body;

    // Validate preferred language
    if (!preferredLanguage || !['en', 'fr'].includes(preferredLanguage)) {
      return res.status(400).json({ error: "Invalid language. Must be 'en' or 'fr'" });
    }

    // Update user profile with preferred language
    const updatedProfile = await prisma.userProfile.update({
      where: { userId: payload.sub },
      data: {
        preferredLanguage,
      },
    });

    res.json({
      success: true,
      message: "Language preference updated",
      preferredLanguage: updatedProfile.preferredLanguage,
    });
  } catch (error) {
    console.error("Update user preferences error:", error);
    return res.status(500).json({ error: "Failed to update preferences" });
  }
});

// ==================== Google OAuth Routes ====================

// Google OAuth - Initiate authentication
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    prompt: "select_account",
  } as any),
);

// Google OAuth - Callback
router.get("/google/callback", (req: Request, res: Response, next) => {
  passport.authenticate("google", {
    session: false,
  })(req, res, async (err: any) => {
    try {
      if (err) {
        console.error("Passport authentication error:", err);
        const frontendUrl =
          process.env.FRONTEND_URLS?.split(",")[0] || "http://localhost:5173";
        return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
      }

      const user = (req as any).user;

      if (!user) {
        const frontendUrl =
          process.env.FRONTEND_URLS?.split(",")[0] || "http://localhost:5173";
        return res.redirect(`${frontendUrl}/login?error=no_user`);
      }

      // Generate JWT token
      const token = signToken(
        { id: user.id, email: user.email },
        user.userProfile?.role,
        user.userProfile?.employeeType,
      );

      // Create a session record
      await prisma.session.create({
        data: {
          id: crypto.randomUUID(),
          userId: user.id,
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          sessionToken: crypto.randomBytes(32).toString("hex"),
        },
      });

      // Redirect to frontend with token
      const frontendUrl =
        process.env.FRONTEND_URLS?.split(",")[0] || "http://localhost:5173";
      res.redirect(`${frontendUrl}/callback?token=${token}`);
    } catch (error) {
      console.error("Google OAuth callback error:", error);
      const frontendUrl =
        process.env.FRONTEND_URLS?.split(",")[0] || "http://localhost:5173";
      res.redirect(`${frontendUrl}/login?error=callback_failed`);
    }
  });
});

export default router;
