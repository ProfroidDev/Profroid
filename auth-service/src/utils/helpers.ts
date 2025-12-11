/**
 * Helper functions for authentication
 */

import { PrismaClient } from "@prisma/client";
import { UserRole } from "../types/index";

const prisma = new PrismaClient();

/**
 * Get user by ID
 */
export async function getUserById(userId: string) {
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
 */
export async function getUserByEmail(email: string) {
  return await prisma.user.findUnique({
    where: { email },
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
 */
export function generateRandomString(length: number = 32): string {
  return require("crypto")
    .randomBytes(length)
    .toString("hex");
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function isStrongPassword(password: string): {
  isStrong: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    isStrong: errors.length === 0,
    errors,
  };
}
