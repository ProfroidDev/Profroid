import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || process.env.BETTER_AUTH_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is required");
}

export interface AuthRequest extends Request {
  userId?: string;
  user?: any;
  session?: any;
}

/**
 * Middleware to verify JWT token from Authorization header
 */
export const verifyAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const token = authHeader.substring(7);
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string };

    req.userId = payload.sub;
    next();
  } catch (error) {
    console.error("Auth verification error:", error);
    res.status(401).json({ error: "Unauthorized" });
  }
};

/**
 * Middleware to check if user has specific role
 */
export const requireRole = (allowedRoles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const token = authHeader.substring(7);
      const payload = jwt.verify(token, JWT_SECRET) as { sub: string };

      // Get user profile with role
      const userProfile = await prisma.userProfile.findUnique({
        where: { userId: payload.sub },
      });

      if (!userProfile || !allowedRoles.includes(userProfile.role)) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }

      req.userId = payload.sub;
      next();
    } catch (error) {
      console.error("Role verification error:", error);
      res.status(401).json({ error: "Unauthorized" });
    }
  };
};

/**
 * Optional auth middleware - doesn't fail if no session
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
      req.userId = payload.sub;
    }

    next();
  } catch (error) {
    // Optional auth, so we continue even if there's an error
    next();
  }
};
