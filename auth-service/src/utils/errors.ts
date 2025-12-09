/**
 * Error handling and custom exceptions
 */

export class AuthError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export class ValidationError extends AuthError {
  constructor(message: string) {
    super("VALIDATION_ERROR", 400, message);
    this.name = "ValidationError";
  }
}

export class UnauthorizedError extends AuthError {
  constructor(message: string = "Unauthorized") {
    super("UNAUTHORIZED", 401, message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AuthError {
  constructor(message: string = "Forbidden") {
    super("FORBIDDEN", 403, message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AuthError {
  constructor(message: string = "Not found") {
    super("NOT_FOUND", 404, message);
    this.name = "NotFoundError";
  }
}

export class DuplicateError extends AuthError {
  constructor(message: string = "Resource already exists") {
    super("DUPLICATE", 409, message);
    this.name = "DuplicateError";
  }
}

export class InternalError extends AuthError {
  constructor(message: string = "Internal server error") {
    super("INTERNAL_ERROR", 500, message);
    this.name = "InternalError";
  }
}
