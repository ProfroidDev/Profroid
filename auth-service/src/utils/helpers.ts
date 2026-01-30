/**
 * Helper functions for authentication with input sanitization
 */

import { PrismaClient } from "@prisma/client";
import { UserRole } from "../types/index.js";
import {
  sanitizeEmail as sanitizeEmailUtil,
  sanitizeString,
} from "./sanitizer.js";

const prisma = new PrismaClient();

/**
 * Get user by ID
 * Safely retrieves user by ID with parameterized query (Prisma handles this)
 */
export async function getUserById(userId: string) {
  // Prisma uses parameterized queries internally, safe from SQL injection
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      image: true,
      emailVerified: true,
      createdAt: true,
    },
  });
}

/**
 * Get user by email
 * Safely retrieves user by email with input sanitization
 * @param email - User email (will be sanitized)
 */
export async function getUserByEmail(email: string) {
  // Sanitize email input before database query
  const sanitizedEmail = sanitizeEmailUtil(email);

  if (!sanitizedEmail) {
    return null; // Return null if email is invalid
  }

  // Prisma uses parameterized queries internally, safe from SQL injection
  return await prisma.user.findUnique({
    where: { email: sanitizedEmail },
    select: {
      id: true,
      email: true,
      image: true,
      emailVerified: true,
      createdAt: true,
    },
  });
}

/**
 * Check if user has role
 */
export function hasRole(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole);
}

/**
 * Check if user is admin
 */
export function isAdmin(userRole: string): boolean {
  return userRole === UserRole.ADMIN;
}

/**
 * Check if user is employee
 */
export function isEmployee(userRole: string): boolean {
  return userRole === UserRole.EMPLOYEE;
}

/**
 * Check if user is customer
 */
export function isCustomer(userRole: string): boolean {
  return userRole === UserRole.CUSTOMER;
}

/**
 * Generate random string for tokens
 * Uses cryptographically secure random bytes
 */
export function generateRandomString(length: number = 32): string {
  return require("crypto")
    .randomBytes(length)
    .toString("hex");
}

/**
 * Validate email format with strict rules
 * - Must contain @ symbol
 * - Must have domain with proper TLD (2-6 chars)
 * - Only allows valid email characters
 * 
 * @param email - Email to validate (will be sanitized first)
 * @returns boolean - True if email is valid
 */
export function isValidEmail(email: string): boolean {
  // Sanitize email first to remove dangerous characters
  const sanitized = sanitizeEmailUtil(email);

  if (!sanitized) {
    return false;
  }

  // Strict email validation regex:
  // - Allows alphanumeric, +, -, ., _
  // - Requires @ symbol
  // - Requires domain with at least one dot
  // - TLD must be 2-6 characters of letters only
  const emailRegex = /^[a-z0-9+\-._]+@[a-z0-9+\-._]+\.[a-z]{2,6}$/i;

  return emailRegex.test(sanitized);
}

/**
 * Validate password strength with detailed error reporting
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * 
 * @param password - Password to validate (will be sanitized first)
 * @returns Object with isStrong boolean and array of error messages
 */
export function isStrongPassword(password: string): {
  isStrong: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Sanitize password to remove dangerous characters
  const sanitized = password.replace(/\0/g, "").replace(/[\x00-\x1F\x7F]/g, "");

  if (sanitized.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/[A-Z]/.test(sanitized)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(sanitized)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/[0-9]/.test(sanitized)) {
    errors.push("Password must contain at least one number");
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(sanitized)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    isStrong: errors.length === 0,
    errors,
  };
}

/**
 * Validate and sanitize user input
 * Removes SQL injection and XSS attack vectors
 * 
 * @param input - User input to validate
 * @param fieldType - Type of field (email, name, address, etc.)
 * @returns Sanitized input or null if invalid
 */
export function validateAndSanitizeInput(
  input: string,
  fieldType: "email" | "name" | "address" | "generic" = "generic"
): string | null {
  if (!input || typeof input !== "string") {
    return null;
  }

  let sanitized: string;

  switch (fieldType) {
    case "email":
      sanitized = sanitizeEmailUtil(input);
      // Validate email format
      if (!isValidEmail(sanitized)) {
        return null;
      }
      break;

    case "name":
      sanitized = sanitizeString(input);
      // Names should not be empty after sanitization
      if (!sanitized || sanitized.length === 0) {
        return null;
      }
      break;

    case "address":
      sanitized = sanitizeString(input);
      // Addresses should not be empty after sanitization
      if (!sanitized || sanitized.length === 0) {
        return null;
      }
      break;

    case "generic":
    default:
      sanitized = sanitizeString(input);
      if (!sanitized || sanitized.length === 0) {
        return null;
      }
      break;
  }

  return sanitized;
}
