/**
 * Validation schemas using Zod
 */

import { z } from "zod";

export const RegisterSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().optional(),
});

export const SignInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const UpdateProfileSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  country: z.string().optional(),
});

export const ChangePasswordSchema = z.object({
  oldPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string()
    .min(8, "New password must be at least 8 characters")
    .refine(
      (pwd) => /[A-Z]/.test(pwd) && /[0-9]/.test(pwd),
      "Password must contain at least one uppercase letter and one number"
    ),
});

export const VerifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

// Type inference from Zod schemas
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type SignInInput = z.infer<typeof SignInSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
export type VerifyEmailInput = z.infer<typeof VerifyEmailSchema>;
