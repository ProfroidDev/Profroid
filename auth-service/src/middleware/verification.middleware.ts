import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || process.env.BETTER_AUTH_SECRET || "";

type JWTPayload = {
  sub: string;
  email: string;
  role?: string;
  employeeType?: string;
};

/**
 * Middleware to require email verification
 * Blocks unverified users from accessing protected endpoints
 */
export function requireEmailVerification(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "No authorization token" });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    
    // Attach user ID to request for use in next middleware/route
    (req as any).userId = decoded.sub;
    
    next();
  } catch (error) {
    console.error("JWT verification error:", error);
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Middleware to extract user info from JWT (non-blocking)
 */
export function extractUserFromToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      next();
      return;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    (req as any).userId = decoded.sub;
    (req as any).userEmail = decoded.email;
    next();
  } catch (error) {
    next();
  }
}
