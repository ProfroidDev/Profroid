import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";
import bcrypt from "bcrypt";
import {
  generateVerificationToken,
  verifyTokenHash,
  isTokenExpired,
  getTokenExpirationTime,
  checkVerificationRateLimit,
  getLockTime,
} from "../utils/verification.js";

const prisma = new PrismaClient();
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || "";
const SMTP_FROM = process.env.SMTP_FROM || "noreply@profroid.com";
const FRONTEND_URL = process.env.FRONTEND_URLS?.split(",")[0] || "http://localhost:5173";

// Track resend attempts in memory (for demo - use Redis in production)
// Key: "resend:email:timestamp", Value: count
const resendAttempts = new Map<string, { count: number; resetTime: number }>();

/**
 * Track resend verification email attempts
 * Limits: 3 per hour, 10 per day per email
 */
export function trackResendAttempt(email: string): {
  allowed: boolean;
  message: string;
  retryAfterSeconds?: number;
} {
  const now = Date.now();
  const hourKey = `resend:${email}:hour`;
  const dayKey = `resend:${email}:day`;

  // Cleanup old entries
  for (const [key, value] of resendAttempts.entries()) {
    if (now > value.resetTime) {
      resendAttempts.delete(key);
    }
  }

  // Get current attempt counts
  const hourData = resendAttempts.get(hourKey) || { count: 0, resetTime: now + 60 * 60 * 1000 };
  const dayData = resendAttempts.get(dayKey) || { count: 0, resetTime: now + 24 * 60 * 60 * 1000 };

  // Check limits
  if (hourData.count >= 3) {
    const retryAfter = Math.ceil((hourData.resetTime - now) / 1000);
    return {
      allowed: false,
      message: `Too many resend attempts. Try again in ${Math.ceil(retryAfter / 60)} minutes.`,
      retryAfterSeconds: retryAfter,
    };
  }

  if (dayData.count >= 10) {
    const retryAfter = Math.ceil((dayData.resetTime - now) / 1000);
    return {
      allowed: false,
      message: "Daily resend limit exceeded. Try again tomorrow.",
      retryAfterSeconds: retryAfter,
    };
  }

  // Increment counters
  hourData.count++;
  dayData.count++;
  resendAttempts.set(hourKey, hourData);
  resendAttempts.set(dayKey, dayData);

  return { allowed: true, message: "Resend email sent" };
}

/**
 * Create transporter for nodemailer
 */
function createTransporter() {
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
  });
}

/**
 * Send verification email
 */
export async function sendVerificationEmail(
  email: string,
  token: string,
  name?: string
): Promise<void> {
  const transporter = createTransporter();
  const verificationUrl = `${FRONTEND_URL}/auth/verify-email?token=${token}`;
  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, "$1***$3");
  
  // Display the token as verification code (first 8 characters uppercase)
  const displayCode = token.substring(0, 8).toUpperCase();

  const mailOptions = {
    from: SMTP_FROM,
    to: email,
    subject: "Verify Your Email - Profroid",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #4CAF50;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              background-color: #f9f9f9;
              padding: 30px;
              border: 1px solid #ddd;
              border-top: none;
              border-radius: 0 0 5px 5px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              margin: 20px 0;
              background-color: #4CAF50;
              color: white !important;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
            }
            .footer {
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #666;
            }
            .warning {
              background-color: #fff3cd;
              border: 1px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
              border-radius: 5px;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Verify Your Email</h1>
            </div>
            <div class="content">
              <p>Hello ${name || "User"},</p>
              
              <p>Thank you for signing up! To complete your registration, please verify your email address.</p>
              
              <h3 style="text-align: center; background: #f0f0f0; padding: 15px; border-radius: 5px; font-size: 24px; letter-spacing: 2px; color: #4CAF50;">
                ${displayCode}
              </h3>
              
              <p style="text-align: center; color: #666; font-size: 14px;">Enter this code on the verification page, or click the button below:</p>
              
              <center>
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </center>
              
              <p style="margin-top: 20px;">Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all; font-size: 12px; color: #666;">${verificationUrl}</p>
              
              <div class="warning">
                <strong>⏱️ This link expires in 2 hours</strong><br>
                For security reasons, verification links are valid for 2 hours only.
              </div>
              
              <div class="warning">
                <strong>ℹ️ Didn't sign up?</strong><br>
                If you didn't create this account, you can safely ignore this email.
              </div>
              
              <div class="footer">
                <p>This email was sent to ${maskedEmail}</p>
                <p>&copy; 2026 Profroid. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error(`Failed to send verification email to ${email}:`, error);
    throw new Error("Failed to send verification email");
  }
}

/**
 * Verify an email token
 * Returns: { success: boolean; message: string; error?: string }
 */
export async function verifyEmailToken(
  token: string
): Promise<{
  success: boolean;
  message: string;
  userId?: string;
  email?: string;
  error?: string;
}> {
  try {
    // First, find all users with valid, non-expired tokens
    const user = await prisma.user.findFirst({
      where: {
        AND: [
          { verificationTokenExpiresAt: { gt: new Date() } },
          {
            OR: [
              { verificationTokenHash: { not: null } },
              { verificationDisplayCodeHash: { not: null } },
            ],
          },
        ],
      },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        verificationTokenHash: true,
        verificationDisplayCodeHash: true,
        verificationTokenExpiresAt: true,
        verificationAttempts: true,
        verificationLockedUntil: true,
      },
    });

    if (!user || (!user.verificationTokenHash && !user.verificationDisplayCodeHash)) {
      return { success: false, message: "Invalid or expired verification link", error: "INVALID_TOKEN" };
    }

    // Check if token matches using verifyTokenHash (constant-time comparison)
    let tokenMatches = false;
    if (user.verificationTokenHash) {
      tokenMatches = verifyTokenHash(token, user.verificationTokenHash);
    }

    // If full token didn't match, check display code with bcrypt
    if (!tokenMatches && user.verificationDisplayCodeHash) {
      try {
        tokenMatches = await bcrypt.compare(token.toUpperCase(), user.verificationDisplayCodeHash);
      } catch (err) {
        console.error("Bcrypt comparison error:", err);
      }
    }

    if (!tokenMatches) {
      return { success: false, message: "Invalid verification code", error: "INVALID_TOKEN" };
    }

    // Token is valid - check if already verified
    if (user.emailVerified) {
      return { success: true, message: "Email already verified", userId: user.id, email: user.email || undefined };
    }

    // Mark as verified
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        verificationTokenHash: null,
        verificationDisplayCodeHash: null,
        verificationTokenExpiresAt: null,
        verificationAttempts: 0,
        verificationLockedUntil: null,
      },
    });

    return {
      success: true,
      message: "Email verified successfully",
      userId: updatedUser.id,
      email: updatedUser.email || undefined,
    };
  } catch (error) {
    console.error("Email verification error:", error);
    return { success: false, message: "Email verification failed", error: "INTERNAL_ERROR" };
  }
}

/**
 * Generate and store new verification token for user
 */
export async function generateAndStoreVerificationToken(userId: string): Promise<{
  token: string;
  expiresAt: Date;
}> {
  const { token, hash } = generateVerificationToken();
  const expiresAt = getTokenExpirationTime();
  
  // Generate display code (first 8 chars) and hash it with bcrypt
  const displayCode = token.substring(0, 8).toUpperCase();
  const displayCodeHash = await bcrypt.hash(displayCode, 12); // 12 rounds of bcrypt

  await prisma.user.update({
    where: { id: userId },
    data: {
      verificationTokenHash: hash,
      verificationTokenExpiresAt: expiresAt,
      verificationDisplayCodeHash: displayCodeHash,
      verificationAttempts: 0,
      verificationLockedUntil: null,
    },
  });

  return { token, expiresAt };
}

/**
 * Check if user is rate limited on verification attempts
 */
export function isUserVerificationLocked(
  attempts: number,
  lockedUntil: Date | null | undefined
): { isLocked: boolean; minutesRemaining: number } {
  return checkVerificationRateLimit(attempts, lockedUntil || null);
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(
  email: string
): Promise<{
  success: boolean;
  message: string;
  retryAfterSeconds?: number;
}> {
  // Check rate limit on resends
  const rateCheckResult = trackResendAttempt(email);
  if (!rateCheckResult.allowed) {
    return {
      success: false,
      message: rateCheckResult.message,
      retryAfterSeconds: rateCheckResult.retryAfterSeconds,
    };
  }

  // Find user (no email enumeration - don't reveal if email exists)
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      verificationAttempts: true,
      verificationLockedUntil: true,
    },
  });

  if (!user) {
    // Return same message to prevent email enumeration
    return { success: true, message: "If an account exists, we sent a verification email" };
  }

  // Check if already verified
  if (user.emailVerified) {
    return { success: true, message: "Email already verified" };
  }

  // Check if rate limited on verification attempts
  const lockCheck = isUserVerificationLocked(
    user.verificationAttempts || 0,
    user.verificationLockedUntil
  );
  if (lockCheck.isLocked) {
    // Still don't reveal - return generic message
    return { success: true, message: "If an account exists, we sent a verification email" };
  }

  // Generate new token
  const { token } = await generateAndStoreVerificationToken(user.id);

  // Send email asynchronously in background to avoid blocking
  sendVerificationEmail(email, token).catch((error) => {
    console.error("Resend verification email error:", error);
  });

  return { success: true, message: "If an account exists, we sent a verification email" };
}
