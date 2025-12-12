import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || "";
const SMTP_FROM = process.env.SMTP_FROM || "noreply@profroid.com";
const FRONTEND_URL = process.env.FRONTEND_URLS?.split(",")[0] || "http://localhost:5173";

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
  name?: string
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
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello ${name || "User"},</p>
              
              <p>We received a request to reset your password for your Profroid account. If you didn't make this request, you can safely ignore this email.</p>
              
              <p>To reset your password, click the button below:</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #4CAF50;">${resetUrl}</p>
              
              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <ul>
                  <li>This link will expire in 1 hour</li>
                  <li>Never share this link with anyone</li>
                  <li>If you didn't request this, please ignore this email</li>
                </ul>
              </div>
              
              <div class="footer">
                <p>This is an automated email from Profroid. Please do not reply to this email.</p>
                <p>&copy; ${new Date().getFullYear()} Profroid. All rights reserved.</p>
              </div>
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
  name?: string
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
            .footer {
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #666;
            }
            .success {
              background-color: #d4edda;
              border: 1px solid #28a745;
              padding: 15px;
              margin: 20px 0;
              border-radius: 5px;
              color: #155724;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Changed Successfully</h1>
            </div>
            <div class="content">
              <p>Hello ${name || "User"},</p>
              
              <div class="success">
                <strong>✓ Your password has been changed successfully.</strong>
              </div>
              
              <p>Your Profroid account password was recently changed. If you made this change, no further action is needed.</p>
              
              <p><strong>If you did not make this change:</strong></p>
              <ul>
                <li>Your account may have been compromised</li>
                <li>Please contact our support team immediately</li>
                <li>Consider changing your password on other services where you use the same password</li>
              </ul>
              
              <div class="footer">
                <p>This is an automated email from Profroid. Please do not reply to this email.</p>
                <p>&copy; ${new Date().getFullYear()} Profroid. All rights reserved.</p>
              </div>
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
