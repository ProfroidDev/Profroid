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
        emailVerified: false,
      },
    });

    // Create user profile as PENDING (not active)
    const profile = await prisma.userProfile.create({
      data: {
        userId: user.id,
        role: "customer",
        isActive: false, // Not active until customer data is submitted
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

    // DO NOT issue token yet - user must complete customer registration first
    return res.status(201).json({
      success: true,
      requiresCompletion: true,
      userId: user.id,
      message: "Please complete your customer registration",
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

    // Check if user has completed registration (customer data)
    if (!profile?.isActive) {
      return res.status(200).json({
        success: false,
        requiresCompletion: true,
        userId: user.id,
        message: "Please complete your customer registration",
      });
    }

    const token = signToken({ id: user.id, email: user.email as string }, profile?.role);

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

/**
 * Get all users without employee profile (for admin to create employees)
 * GET /api/auth/unassigned-users
 * Headers: Authorization: Bearer <jwt>
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

    // Get all users who don't have an employee role or don't have an employeeType set
    const unassignedUsers = await prisma.userProfile.findMany({
      where: {
        OR: [
          { role: "customer" },
          { AND: [{ role: "employee" }, { employeeType: null }] },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    res.json({
      success: true,
      users: unassignedUsers.map((up) => ({
        id: up.user.id,
        email: up.user.email,
      })),
    });
  } catch (error) {
    console.error("Fetch unassigned users error:", error);
    return res.status(500).json({ error: "Failed to fetch unassigned users" });
  }
});

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
 * No auth required - but validates userId is pending
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

        console.log("Customer payload:", JSON.stringify(customerPayload, null, 2));

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
            details: errorData.message || errorData.error || `Backend returned ${backendResponse.status}`,
            backendUrl
          });
        }

        console.log("Customer created successfully in backend");
      } catch (backendError) {
        console.error("Error calling backend:", backendError);
        const errorMessage = backendError instanceof Error ? backendError.message : "Unknown error";
        return res.status(500).json({ 
          error: "Failed to communicate with backend service",
          details: errorMessage,
          backendUrl: process.env.BACKEND_URL || "http://localhost:8080"
        });
      }
    }

    // Activate user profile
    const updatedProfile = await prisma.userProfile.update({
      where: { userId },
      data: { isActive: true },
    });

    // Issue token now that registration is complete
    const token = signToken({ id: user.id, email: user.email as string }, updatedProfile.role);

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
router.delete("/cancel-registration/:userId", async (req: Request, res: Response) => {
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
});

export default router;
