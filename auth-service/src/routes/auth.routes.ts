import { Router, type Request, type Response } from "express";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const router = Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || process.env.BETTER_AUTH_SECRET || "";
const JWT_EXPIRES_IN = "7d";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is required");
}

// Simple password hashing (for demo - use bcrypt in production)
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

type JWTPayload = {
  sub: string;
  email: string;
  role?: string;
};

function signToken(user: { id: string; email: string }, role?: string): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: role || "customer",
    },
    JWT_SECRET as string,
    { expiresIn: JWT_EXPIRES_IN }
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
 */
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        email,
        name: name || null,
        emailVerified: false,
      },
    });

    // Create user profile
    const profile = await prisma.userProfile.create({
      data: {
        userId: user.id,
        role: "customer",
        isActive: true,
      },
    });

    // Store password separately
    await prisma.account.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        type: "email",
        provider: "email",
        providerAccountId: email,
        accessToken: hashPassword(password),
      },
    });

    const token = signToken({ id: user.id, email: user.email as string }, profile.role);

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: profile.role,
        isActive: profile.isActive,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ error: "Registration failed" });
  }
});

/**
 * Sign in user
 * POST /api/auth/sign-in
 */
router.post("/sign-in", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Get password hash
    const account = await prisma.account.findFirst({
      where: { userId: user.id, provider: "email" },
    });

    if (!account || !verifyPassword(password, account.accessToken || "")) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Get user profile
    const profile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
    });

    const token = signToken({ id: user.id, email: user.email as string }, profile?.role);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
        role: profile?.role || "customer",
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
        name: user.name,
        image: user.image,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        role: profile?.role || "customer",
        isActive: profile?.isActive || true,
        phone: profile?.phone,
        address: profile?.address,
        postalCode: profile?.postalCode,
        city: profile?.city,
        province: profile?.province,
        country: profile?.country,
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

    const { name, phone, address, postalCode, city, province, country } = req.body;

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: payload.sub },
      data: {
        ...(name && { name }),
      },
    });

    // Update or create profile
    let profile = await prisma.userProfile.findUnique({
      where: { userId: payload.sub },
    });

    if (!profile) {
      profile = await prisma.userProfile.create({
        data: {
          userId: payload.sub,
          phone: phone || null,
          address: address || null,
          postalCode: postalCode || null,
          city: city || null,
          province: province || null,
          country: country || null,
        },
      });
    } else {
      profile = await prisma.userProfile.update({
        where: { userId: payload.sub },
        data: {
          ...(phone !== undefined && { phone }),
          ...(address !== undefined && { address }),
          ...(postalCode !== undefined && { postalCode }),
          ...(city !== undefined && { city }),
          ...(province !== undefined && { province }),
          ...(country !== undefined && { country }),
        },
      });
    }

    res.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        image: updatedUser.image,
        emailVerified: updatedUser.emailVerified,
        createdAt: updatedUser.createdAt,
        role: profile.role,
        isActive: profile.isActive,
        phone: profile.phone,
        address: profile.address,
        postalCode: profile.postalCode,
        city: profile.city,
        province: profile.province,
        country: profile.country,
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
      return res.status(400).json({ error: "Old password and new password are required" });
    }

    // Get account and verify old password
    const account = await prisma.account.findFirst({
      where: { userId: payload.sub, provider: "email" },
    });

    if (!account || !verifyPassword(oldPassword, account.accessToken || "")) {
      return res.status(401).json({ error: "Invalid current password" });
    }

    // Update password
    await prisma.account.update({
      where: { id: account.id },
      data: {
        accessToken: hashPassword(newPassword),
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
 * Health check
 * GET /api/auth/health
 */
router.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", message: "Auth service is running" });
});

export default router;
