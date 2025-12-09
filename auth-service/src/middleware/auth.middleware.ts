import { Request, Response, NextFunction } from "express";
import auth from "../lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
    const session = await auth.api.getSession({
      headers: req.headers,
    } as any);

    if (!session?.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    req.userId = session.user.id;
    req.user = session.user;
    req.session = session;
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
      const session = await auth.api.getSession({
        headers: req.headers,
      } as any);

      if (!session?.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      // Get user profile with role
      const userProfile = await prisma.userProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!userProfile || !allowedRoles.includes(userProfile.role)) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }

      req.userId = session.user.id;
      req.user = session.user;
      req.session = session;
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
    const session = await auth.api.getSession({
      headers: req.headers,
    } as any);

    if (session?.user) {
      req.userId = session.user.id;
      req.user = session.user;
      req.session = session;
    }

    next();
  } catch (error) {
    // Optional auth, so we continue even if there's an error
    next();
  }
};
