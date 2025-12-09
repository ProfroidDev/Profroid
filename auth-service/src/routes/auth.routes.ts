import { Router, type Request, type Response } from "express";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const router = Router();
const prisma = new PrismaClient();

// Simple password hashing (for demo - use bcrypt in production)
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
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
    await prisma.userProfile.create({
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

    return res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
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

    // Create session
    const session = await prisma.session.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Get user profile
    const profile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
    });

    res.json({
      success: true,
      session: {
        id: session.id,
        userId: user.id,
        expires: session.expires,
      },
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
        role: profile?.role || "customer",
        isActive: profile?.isActive || true,
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
 * Headers: Authorization: Bearer <sessionId>
 */
router.get("/user", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No authorization token" });
    }

    const sessionId = authHeader.substring(7);

    // Find session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.expires < new Date()) {
      return res.status(401).json({ error: "Invalid or expired session" });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
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
 * Headers: Authorization: Bearer <sessionId>
 */
router.put("/user", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No authorization token" });
    }

    const sessionId = authHeader.substring(7);

    // Verify session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.expires < new Date()) {
      return res.status(401).json({ error: "Invalid or expired session" });
    }

    const { name, phone, address, postalCode, city, province, country } = req.body;

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: {
        ...(name && { name }),
      },
    });

    // Update or create profile
    let profile = await prisma.userProfile.findUnique({
      where: { userId: session.userId },
    });

    if (!profile) {
      profile = await prisma.userProfile.create({
        data: {
          userId: session.userId,
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
        where: { userId: session.userId },
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
 * Headers: Authorization: Bearer <sessionId>
 */
router.post("/change-password", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No authorization token" });
    }

    const sessionId = authHeader.substring(7);
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: "Old password and new password are required" });
    }

    // Verify session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.expires < new Date()) {
      return res.status(401).json({ error: "Invalid or expired session" });
    }

    // Get account and verify old password
    const account = await prisma.account.findFirst({
      where: { userId: session.userId, provider: "email" },
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
 * Headers: Authorization: Bearer <sessionId>
 */
router.post("/sign-out", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No authorization token" });
    }

    const sessionId = authHeader.substring(7);

    // Delete session
    await prisma.session.delete({
      where: { id: sessionId },
    }).catch(() => {
      // Session might not exist, ignore
    });

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
