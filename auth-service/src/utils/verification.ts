import crypto from "crypto";

/**
 * Generate a cryptographically secure verification token
 * Returns both the raw token (to send in email) and its hash (to store in DB)
 * 
 * Security: 
 * - 32 bytes = 256 bits of entropy = ~43 billion billion combinations
 * - Single-use: Once verified, token is deleted from DB
 * - Hashed: Even if DB is leaked, tokens are not exposed
 */
export function generateVerificationToken(): {
  token: string;
  hash: string;
} {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(rawToken).digest("hex");
  return { token: rawToken, hash };
}

/**
 * Verify a token against its hash
 * Prevents timing attacks by always hashing the input
 */
export function verifyTokenHash(
  inputToken: string,
  storedHash: string
): boolean {
  const inputHash = crypto.createHash("sha256").update(inputToken).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(storedHash));
}

/**
 * Check if a verification token has expired
 */
export function isTokenExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return true;
  return new Date() > expiresAt;
}

/**
 * Get token expiration time (2 hours from now)
 */
export function getTokenExpirationTime(): Date {
  return new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
}

/**
 * Check if user should be rate limited on verification attempts
 * Returns: { isLocked: boolean, minutesRemaining: number }
 */
export function checkVerificationRateLimit(
  attempts: number,
  lockedUntil: Date | null
): { isLocked: boolean; minutesRemaining: number } {
  const now = new Date();

  // Check if currently locked
  if (lockedUntil && now < lockedUntil) {
    const minutesRemaining = Math.ceil(
      (lockedUntil.getTime() - now.getTime()) / (60 * 1000)
    );
    return { isLocked: true, minutesRemaining };
  }

  // Check if attempts exceed limit (5 attempts)
  if (attempts >= 5) {
    return {
      isLocked: true,
      minutesRemaining: 15, // Lock for 15 minutes
    };
  }

  return { isLocked: false, minutesRemaining: 0 };
}

/**
 * Get lock time (15 minutes from now)
 */
export function getLockTime(): Date {
  return new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
}
