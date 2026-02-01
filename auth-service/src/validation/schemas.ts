/**
 * Validation schemas using Zod with input sanitization and SQL injection protection
 */

import { z } from "zod";
import {
  sanitizeEmail,
  sanitizePassword,
  sanitizeString,
  sanitizeToken,
} from "../utils/sanitizer.js";

// Strict email validation: requires proper domain format with valid TLD (2-6 chars)
// Accepts: user@domain.com, user+tag@domain.com, user_name@domain.co.uk, etc.
// Requires proper TLD ending (.com, .org, .ca, etc.)
const emailRegex = /^[a-z0-9+\-._]+@[a-z0-9+\-._]+\.[a-z]{2,6}$/i;

/**
 * Register Schema - Validates user registration input
 * - Email: Sanitized, lowercase, validated against strict regex
 * - Password: NOT sanitized (must match login password exactly), min 8 chars with uppercase and number
 * - Name: Optional, sanitized
 */
export const RegisterSchema = z
  .object({
    email: z
      .string()
      .min(1, "Email is required")
      .transform((val) => sanitizeEmail(val))
      .refine((val) => val.length > 0, "Email contains invalid characters")
      .refine(
        (val) => emailRegex.test(val),
        "Invalid email address. Must be in format: user@domain.com"
      ),
    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters")
      .refine(
        (pwd) => /[A-Z]/.test(pwd) && /[0-9]/.test(pwd),
        "Password must contain at least one uppercase letter and one number"
      ),
    name: z
      .string()
      .optional()
      .transform((val) => (val ? sanitizeString(val) : undefined)),
  })
  .strict();

/**
 * Sign In Schema - Validates and sanitizes login input
 * - Email: Sanitized, validated
 * - Password: NOT sanitized (must match original hash exactly)
 */
export const SignInSchema = z
  .object({
    email: z
      .string()
      .min(1, "Email is required")
      .transform((val) => sanitizeEmail(val))
      .refine((val) => val.length > 0, "Email contains invalid characters")
      .refine(
        (val) => emailRegex.test(val),
        "Invalid email address. Must be in format: user@domain.com"
      ),
    password: z
      .string()
      .min(1, "Password is required"),
  })
  .strict();

/**
 * Update Profile Schema - Validates and sanitizes profile update input
 * All fields are optional but sanitized when provided
 */
export const UpdateProfileSchema = z
  .object({
    name: z
      .string()
      .optional()
      .transform((val) => (val ? sanitizeString(val).trim() : undefined)),
    phone: z
      .string()
      .optional()
      .transform((val) =>
        val ? sanitizeString(val).replace(/[^\d\s\-()+ .]/g, "") : undefined
      ),
    address: z
      .string()
      .optional()
      .transform((val) =>
        val ? sanitizeString(val).replace(/[^\w\s\-.,#']/gu, "") : undefined
      ),
    postalCode: z
      .string()
      .optional()
      .transform((val) =>
        val ? sanitizeString(val).toUpperCase().replace(/[^A-Z0-9\s]/g, "") : undefined
      ),
    city: z
      .string()
      .optional()
      .transform((val) =>
        val ? sanitizeString(val).replace(/[^\w\s\-']/gu, "") : undefined
      ),
    province: z
      .string()
      .optional()
      .transform((val) => (val ? sanitizeString(val).trim() : undefined)),
    country: z
      .string()
      .optional()
      .transform((val) => (val ? sanitizeString(val).trim() : undefined)),
  })
  .strict();

/**
 * Change Password Schema - Validates password change input
 * Passwords are NOT sanitized - they must match original hashes exactly
 */
export const ChangePasswordSchema = z
  .object({
    oldPassword: z
      .string()
      .min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(1, "New password is required")
      .min(8, "New password must be at least 8 characters")
      .refine(
        (pwd) => /[A-Z]/.test(pwd) && /[0-9]/.test(pwd),
        "Password must contain at least one uppercase letter and one number"
      ),
  })
  .strict();

/**
 * Verify Email Schema - Validates and sanitizes email verification token
 * Token is alphanumeric only
 */
export const VerifyEmailSchema = z
  .object({
    token: z
      .string()
      .min(1, "Verification token is required")
      .transform((val) => sanitizeToken(val))
      .refine((val) => val.length > 0, "Invalid verification token"),
  })
  .strict();

/**
 * Forgot Password Schema - Validates and sanitizes password reset request
 */
export const ForgotPasswordSchema = z
  .object({
    email: z
      .string()
      .min(1, "Email is required")
      .transform((val) => sanitizeEmail(val))
      .refine((val) => val.length > 0, "Email contains invalid characters")
      .refine(
        (val) => emailRegex.test(val),
        "Invalid email address. Must be in format: user@domain.com"
      ),
  })
  .strict();

/**
 * Reset Password Schema - Validates and sanitizes password reset confirmation
 */
export const ResetPasswordSchema = z
  .object({
    token: z
      .string()
      .min(1, "Reset token is required")
      .transform((val) => sanitizeToken(val))
      .refine((val) => val.length > 0, "Invalid reset token"),
    newPassword: z
      .string()
      .min(1, "New password is required")
      .min(8, "New password must be at least 8 characters")
      .transform((val) => sanitizePassword(val))
      .refine(
        (pwd) => /[A-Z]/.test(pwd) && /[0-9]/.test(pwd),
        "Password must contain at least one uppercase letter and one number"
      ),
  })
  .strict();

// Type inference from Zod schemas
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type SignInInput = z.infer<typeof SignInSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
export type VerifyEmailInput = z.infer<typeof VerifyEmailSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
