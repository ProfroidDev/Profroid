/**
 * Configuration constants
 */

export const AUTH_CONFIG = {
  SESSION_EXPIRY: 60 * 60 * 24 * 7, // 7 days in seconds
  SESSION_UPDATE_AGE: 60 * 60 * 24, // 1 day in seconds
  PASSWORD_MIN_LENGTH: 8,
  TOKEN_EXPIRY: 60 * 60 * 24, // 24 hours
  VERIFICATION_TOKEN_EXPIRY: 60 * 60 * 24 * 7, // 7 days
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60, // 15 minutes
};

export const USER_ROLES = {
  CUSTOMER: "customer",
  EMPLOYEE: "employee",
  ADMIN: "admin",
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
} as const;

export const ERROR_MESSAGES = {
  UNAUTHORIZED: "Unauthorized access",
  FORBIDDEN: "Forbidden",
  NOT_FOUND: "Resource not found",
  INVALID_EMAIL: "Invalid email address",
  INVALID_PASSWORD: "Invalid password",
  USER_EXISTS: "User already exists",
  USER_NOT_FOUND: "User not found",
  INVALID_CREDENTIALS: "Invalid email or password",
  SESSION_EXPIRED: "Session expired",
  INTERNAL_ERROR: "Internal server error",
  VALIDATION_ERROR: "Validation error",
} as const;
