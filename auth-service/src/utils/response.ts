/**
 * API response helper utilities
 */

import { Response } from "express";
import { AuthError } from "./errors";

export interface ApiResponse<T = any> {
  success: boolean;
  status: number;
  message?: string;
  data?: T;
  error?: string;
  timestamp: string;
}

/**
 * Send success response
 */
export function sendSuccess<T = any>(
  res: Response,
  data: T,
  message: string = "Success",
  statusCode: number = 200
): Response {
  return res.status(statusCode).json({
    success: true,
    status: statusCode,
    message,
    data,
    timestamp: new Date().toISOString(),
  } as ApiResponse<T>);
}

/**
 * Send error response
 */
export function sendError(
  res: Response,
  error: string | AuthError,
  statusCode: number = 500
): Response {
  if (error instanceof AuthError) {
    return res.status(error.statusCode).json({
      success: false,
      status: error.statusCode,
      error: error.message,
      message: error.message,
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }

  return res.status(statusCode).json({
    success: false,
    status: statusCode,
    error: typeof error === "string" ? error : "Internal server error",
    timestamp: new Date().toISOString(),
  } as ApiResponse);
}

/**
 * Wrap async route handlers with error handling
 */
export function asyncHandler(
  fn: (req: any, res: Response, next: any) => Promise<void>
) {
  return (req: any, res: Response, next: any) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      console.error("Route error:", error);
      if (error instanceof AuthError) {
        return sendError(res, error, error.statusCode);
      }
      sendError(res, "Internal server error", 500);
    });
  };
}
