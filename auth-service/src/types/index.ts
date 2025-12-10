/**
 * Type definitions for the authentication system
 */

export interface UserProfile {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  emailVerified: boolean;
  createdAt: Date;
  role: string;
  isActive: boolean;
  phone?: string | null;
  address?: string | null;
  postalCode?: string | null;
  city?: string | null;
  province?: string | null;
  country?: string | null;
}

export interface Session {
  user: UserProfile;
  expires: Date;
  expiresAt?: number;
}

export interface AuthResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  status: "success" | "error";
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  province?: string;
  country?: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export enum UserRole {
  CUSTOMER = "customer",
  EMPLOYEE = "employee",
  ADMIN = "admin",
}
