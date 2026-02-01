import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || "";
const SMTP_FROM = process.env.SMTP_FROM || "noreply@profroid.com";
const FRONTEND_URL =
  process.env.FRONTEND_URLS?.split(",")[0] || "http://localhost:5173";

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true for 465, false for other ports
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
  });
};

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  name?: string,
): Promise<void> {
  const transporter = createTransporter();
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: SMTP_FROM,
    to: email,
    subject: "Password Reset Request - Profroid",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #3a2e2a;
              background-color: #f4f1ec;
              padding: 20px;
            }
            .email-wrapper {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(122, 9, 1, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #7a0901 0%, #a32c1a 100%);
              padding: 40px 30px;
              text-align: center;
            }
            .logo {
              color: #ffffff;
              font-size: 32px;
              font-weight: 700;
              letter-spacing: 1px;
              margin-bottom: 10px;
            }
            .header-subtitle {
              color: #f4f1ec;
              font-size: 14px;
              font-weight: 400;
            }
            .content {
              padding: 40px 30px;
              background-color: #ffffff;
            }
            .greeting {
              font-size: 18px;
              color: #3a2e2a;
              margin-bottom: 20px;
              font-weight: 600;
            }
            .message {
              color: #5c504b;
              margin-bottom: 15px;
              font-size: 15px;
            }
            .button-container {
              text-align: center;
              margin: 35px 0;
            }
            .button {
              display: inline-block;
              padding: 16px 40px;
              background: linear-gradient(90deg, #7a0901 0%, #a32c1a 100%);
              color: #ffffff !important;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              font-size: 16px;
              transition: transform 0.2s ease;
              box-shadow: 0 4px 12px rgba(122, 9, 1, 0.25);
            }
            .button:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 16px rgba(122, 9, 1, 0.35);
            }
            .divider {
              margin: 30px 0;
              text-align: center;
              position: relative;
            }
            .divider::before {
              content: '';
              position: absolute;
              left: 0;
              top: 50%;
              width: 100%;
              height: 1px;
              background-color: #e4e2df;
            }
            .divider-text {
              display: inline-block;
              background-color: #ffffff;
              padding: 0 15px;
              color: #6b615c;
              font-size: 13px;
              position: relative;
            }
            .link-fallback {
              background-color: #f4f1ec;
              padding: 15px;
              border-radius: 6px;
              word-break: break-all;
              font-size: 13px;
              color: #5c504b;
              margin: 20px 0;
            }
            .security-notice {
              background-color: #fff8f0;
              border-left: 4px solid #a32c1a;
              padding: 20px;
              margin: 25px 0;
              border-radius: 4px;
            }
            .security-notice-title {
              color: #7a0901;
              font-weight: 600;
              margin-bottom: 12px;
              font-size: 15px;
            }
            .security-notice ul {
              margin-left: 20px;
              color: #5c504b;
            }
            .security-notice li {
              margin: 8px 0;
              font-size: 14px;
            }
            .footer {
              background-color: #f4f1ec;
              padding: 30px;
              text-align: center;
              border-top: 1px solid #e4e2df;
            }
            .footer-text {
              color: #6b615c;
              font-size: 13px;
              line-height: 1.8;
            }
            .footer-brand {
              color: #7a0901;
              font-weight: 600;
              font-size: 14px;
              margin-top: 15px;
            }
            .footer-copyright {
              color: #8b817c;
              font-size: 12px;
              margin-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="header">
              <div class="logo">PROFROID</div>
              <div class="header-subtitle">Professional Service Management</div>
            </div>
            <div class="content">
              <p class="greeting">Hello ${name || "there"},</p>
              
              <p class="message">We received a request to reset the password for your Profroid account. If you didn't make this request, you can safely ignore this email and your password will remain unchanged.</p>
              
              <p class="message">To reset your password, click the button below:</p>
              
              <div class="button-container">
                <a href="${resetUrl}" class="button">Reset Your Password</a>
              </div>
              
              <div class="divider">
                <span class="divider-text">Or use this link</span>
              </div>
              
              <div class="link-fallback">${resetUrl}</div>
              
              <div class="security-notice">
                <div class="security-notice-title">Security Information</div>
                <ul>
                  <li>This password reset link will expire in <strong>1 hour</strong></li>
                  <li>Never share this link with anyone, including Profroid support staff</li>
                  <li>If you didn't request this reset, please ignore this email</li>
                  <li>Consider enabling two-factor authentication for added security</li>
                </ul>
              </div>
            </div>
            <div class="footer">
              <p class="footer-text">This is an automated message from Profroid.<br>Please do not reply to this email.</p>
              <div class="footer-brand">PROFROID</div>
              <p class="footer-copyright">&copy; ${new Date().getFullYear()} Profroid. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Hello ${name || "User"},

We received a request to reset your password for your Profroid account.

To reset your password, please visit the following link:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this password reset, you can safely ignore this email.

Best regards,
The Profroid Team
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw new Error("Failed to send password reset email");
  }
}

/**
 * Send password change confirmation email
 */
export async function sendPasswordChangedEmail(
  email: string,
  name?: string,
): Promise<void> {
  const transporter = createTransporter();

  const mailOptions = {
    from: SMTP_FROM,
    to: email,
    subject: "Password Changed Successfully - Profroid",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #3a2e2a;
              background-color: #f4f1ec;
              padding: 20px;
            }
            .email-wrapper {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(122, 9, 1, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #7a0901 0%, #a32c1a 100%);
              padding: 40px 30px;
              text-align: center;
            }
            .logo {
              color: #ffffff;
              font-size: 32px;
              font-weight: 700;
              letter-spacing: 1px;
              margin-bottom: 10px;
            }
            .header-subtitle {
              color: #f4f1ec;
              font-size: 14px;
              font-weight: 400;
            }
            .content {
              padding: 40px 30px;
              background-color: #ffffff;
            }
            .greeting {
              font-size: 18px;
              color: #3a2e2a;
              margin-bottom: 20px;
              font-weight: 600;
            }
            .message {
              color: #5c504b;
              margin-bottom: 15px;
              font-size: 15px;
            }
            .success-banner {
              background: linear-gradient(135deg, #d4f1d9 0%, #e8f5e9 100%);
              border-left: 4px solid #4caf50;
              padding: 20px;
              margin: 25px 0;
              border-radius: 4px;
              text-align: center;
            }
            .success-icon {
              font-size: 48px;
              margin-bottom: 10px;
            }
            .success-title {
              color: #2e7d32;
              font-weight: 600;
              font-size: 18px;
              margin-bottom: 5px;
            }
            .success-subtitle {
              color: #558b5a;
              font-size: 14px;
            }
            .warning-notice {
              background-color: #fff4e6;
              border-left: 4px solid #ff9800;
              padding: 20px;
              margin: 25px 0;
              border-radius: 4px;
            }
            .warning-notice-title {
              color: #e65100;
              font-weight: 600;
              margin-bottom: 12px;
              font-size: 15px;
            }
            .warning-notice ul {
              margin-left: 20px;
              color: #5c504b;
            }
            .warning-notice li {
              margin: 8px 0;
              font-size: 14px;
            }
            .security-tip {
              background-color: #f4f1ec;
              padding: 20px;
              border-radius: 6px;
              margin: 25px 0;
            }
            .security-tip-title {
              color: #7a0901;
              font-weight: 600;
              margin-bottom: 10px;
              font-size: 15px;
            }
            .security-tip-text {
              color: #5c504b;
              font-size: 14px;
            }
            .footer {
              background-color: #f4f1ec;
              padding: 30px;
              text-align: center;
              border-top: 1px solid #e4e2df;
            }
            .footer-text {
              color: #6b615c;
              font-size: 13px;
              line-height: 1.8;
            }
            .footer-brand {
              color: #7a0901;
              font-weight: 600;
              font-size: 14px;
              margin-top: 15px;
            }
            .footer-copyright {
              color: #8b817c;
              font-size: 12px;
              margin-top: 10px;
            }
            .timestamp {
              color: #8b817c;
              font-size: 13px;
              margin-top: 15px;
              font-style: italic;
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="header">
              <div class="logo">PROFROID</div>
              <div class="header-subtitle">Professional Service Management</div>
            </div>
            <div class="content">
              <p class="greeting">Hello ${name || "there"},</p>
              
              <div class="success-banner">
                <div class="success-icon">✓</div>
                <div class="success-title">Password Changed Successfully</div>
                <div class="success-subtitle">Your account is secure</div>
              </div>
              
              <p class="message">Your Profroid account password was recently changed. If you made this change, no further action is required. Your account remains secure and protected.</p>
              
              <p class="timestamp">Change occurred on: ${new Date().toLocaleString(
                "en-US",
                {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZoneName: "short",
                },
              )}</p>
              
              <div class="warning-notice">
                <div class="warning-notice-title">Didn't Make This Change?</div>
                <p class="message" style="margin-bottom: 10px;">If you did NOT authorize this password change, take immediate action:</p>
                <ul>
                  <li>Your account may have been compromised</li>
                  <li>Contact our support team immediately</li>
                  <li>Review your recent account activity</li>
                  <li>Change passwords on other services where you use the same credentials</li>
                </ul>
              </div>
              
              <div class="security-tip">
                <div class="security-tip-title">Security Best Practices</div>
                <p class="security-tip-text">To keep your account secure, we recommend using a unique, strong password and enabling two-factor authentication if available.</p>
              </div>
            </div>
            <div class="footer">
              <p class="footer-text">This is an automated security notification from Profroid.<br>Please do not reply to this email.</p>
              <div class="footer-brand">PROFROID</div>
              <p class="footer-copyright">&copy; ${new Date().getFullYear()} Profroid. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Hello ${name || "User"},

Your password has been changed successfully.

Your Profroid account password was recently changed. If you made this change, no further action is needed.

If you did not make this change, please contact our support team immediately.

Best regards,
The Profroid Team
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password changed confirmation email sent to ${email}`);
  } catch (error) {
    console.error("Error sending password changed email:", error);
    // Don't throw error for confirmation emails - it's not critical
  }
}
