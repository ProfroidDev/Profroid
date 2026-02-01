import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || "";
const SMTP_FROM = process.env.SMTP_FROM || "noreply@profroid.com";
const FRONTEND_URL =
  process.env.FRONTEND_URLS?.split(",")[0] || "http://localhost:5173";

interface AppointmentDetails {
  appointmentId: string;
  jobName: string;
  technicianName: string;
  customerName: string;
  appointmentDate: string;
  appointmentStartTime: string;
  appointmentEndTime: string;
  description?: string;
  appointmentAddress?: {
    street?: string;
    city?: string;
    province?: string;
    postalCode?: string;
  };
  cellarName?: string;
  status?: string;
}

interface NotificationRecipient {
  email: string;
  name: string;
  role: "customer" | "technician";
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
 * Format appointment details for email display
 */
function formatAppointmentDetails(details: AppointmentDetails): string {
  const startTime = details.appointmentStartTime.slice(0, 5);
  const endTime = details.appointmentEndTime.slice(0, 5);
  const address = details.appointmentAddress;
  const addressStr = address
    ? `${address.street || ""}, ${address.city || ""}, ${address.province || ""} ${address.postalCode || ""}`.trim()
    : "Not specified";

  return `
    <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
      <tr style="background-color: #f5f5f5;">
        <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold; width: 35%;">Appointment ID:</td>
        <td style="padding: 12px; border: 1px solid #ddd;">${details.appointmentId}</td>
      </tr>
      <tr>
        <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Service:</td>
        <td style="padding: 12px; border: 1px solid #ddd;">${details.jobName}</td>
      </tr>
      <tr style="background-color: #f5f5f5;">
        <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Date:</td>
        <td style="padding: 12px; border: 1px solid #ddd;">${details.appointmentDate}</td>
      </tr>
      <tr>
        <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Time:</td>
        <td style="padding: 12px; border: 1px solid #ddd;">${startTime} - ${endTime}</td>
      </tr>
      <tr style="background-color: #f5f5f5;">
        <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Location:</td>
        <td style="padding: 12px; border: 1px solid #ddd;">${addressStr}</td>
      </tr>
      <tr>
        <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Technician:</td>
        <td style="padding: 12px; border: 1px solid #ddd;">${details.technicianName}</td>
      </tr>
      <tr style="background-color: #f5f5f5;">
        <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Customer:</td>
        <td style="padding: 12px; border: 1px solid #ddd;">${details.customerName}</td>
      </tr>
      ${
        details.cellarName
          ? `
      <tr>
        <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Cellar:</td>
        <td style="padding: 12px; border: 1px solid #ddd;">${details.cellarName}</td>
      </tr>
      `
          : ""
      }
      ${
        details.description
          ? `
      <tr style="background-color: #f5f5f5;">
        <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold; vertical-align: top;">Notes:</td>
        <td style="padding: 12px; border: 1px solid #ddd;">${details.description}</td>
      </tr>
      `
          : ""
      }
    </table>
  `;
}

/**
 * Send appointment booked notification to customer and technician
 */
export async function sendAppointmentBookedNotification(
  recipients: NotificationRecipient[],
  details: AppointmentDetails,
): Promise<void> {
  const transporter = createTransporter();

  for (const recipient of recipients) {
    const greeting =
      recipient.role === "customer" ? "Dear Customer" : "Dear Technician";
    const roleMessage =
      recipient.role === "customer"
        ? "Your appointment has been successfully booked with our team."
        : "A new appointment has been assigned to you.";

    // Use role-specific appointment view URL
    const appointmentUrl =
      recipient.role === "customer"
        ? `${FRONTEND_URL}/my-appointments`
        : `${FRONTEND_URL}/my-jobs`;

    const mailOptions = {
      from: SMTP_FROM,
      to: recipient.email,
      subject: `Appointment Confirmed - ${details.jobName} on ${details.appointmentDate}`,
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
              }
              .success-title {
                color: #2e7d32;
                font-weight: 600;
                font-size: 16px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
                background-color: #ffffff;
                border-radius: 6px;
                overflow: hidden;
              }
              table tr:nth-child(odd) {
                background-color: #f4f1ec;
              }
              table td {
                padding: 14px;
                border: 1px solid #e4e2df;
                font-size: 14px;
              }
              table td:first-child {
                font-weight: 600;
                color: #7a0901;
                width: 35%;
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
                box-shadow: 0 4px 12px rgba(122, 9, 1, 0.25);
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
                <p class="greeting">${greeting},</p>
                
                <div class="success-banner">
                  <div class="success-title">✓ ${roleMessage}</div>
                </div>
                
                <h2 style="color: #7a0901; margin: 25px 0 15px 0; font-size: 20px;">Appointment Details</h2>
                ${formatAppointmentDetails(details)}
                
                <p class="message">Please make sure to arrive on time. If you need to reschedule or cancel this appointment, please contact us as soon as possible.</p>
                
                <div class="button-container">
                  <a href="${appointmentUrl}" class="button">${recipient.role === "customer" ? "View Your Appointments" : "View Your Jobs"}</a>
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
${greeting},

${roleMessage}

Appointment Details:
- Appointment ID: ${details.appointmentId}
- Service: ${details.jobName}
- Date: ${details.appointmentDate}
- Time: ${details.appointmentStartTime.slice(0, 5)} - ${details.appointmentEndTime.slice(0, 5)}
- Location: ${
        details.appointmentAddress
          ? `${details.appointmentAddress.street || ""}, ${details.appointmentAddress.city || ""}`
          : "Not specified"
      }
- Technician: ${details.technicianName}
- Customer: ${details.customerName}

Please make sure to arrive on time. If you need to reschedule or cancel this appointment, please contact us.

Best regards,
The Profroid Team
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Appointment booked notification sent to ${recipient.email}`);
    } catch (error) {
      console.error(
        `Failed to send appointment booked notification to ${recipient.email}:`,
        error,
      );
      throw new Error(
        `Failed to send appointment notification to ${recipient.email}`,
      );
    }
  }
}

/**
 * Send appointment cancellation notification to customer and technician
 */
export async function sendAppointmentCancelledNotification(
  recipients: NotificationRecipient[],
  details: AppointmentDetails,
  cancellationReason?: string,
): Promise<void> {
  const transporter = createTransporter();

  for (const recipient of recipients) {
    const greeting =
      recipient.role === "customer" ? "Dear Customer" : "Dear Technician";

    const mailOptions = {
      from: SMTP_FROM,
      to: recipient.email,
      subject: `Appointment Cancelled - ${details.jobName} on ${details.appointmentDate}`,
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
                background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
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
              .warning-banner {
                background-color: #fff4e6;
                border-left: 4px solid #dc3545;
                padding: 20px;
                margin: 25px 0;
                border-radius: 4px;
              }
              .warning-title {
                color: #c82333;
                font-weight: 600;
                font-size: 16px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
                background-color: #ffffff;
                border-radius: 6px;
                overflow: hidden;
              }
              table tr:nth-child(odd) {
                background-color: #f4f1ec;
              }
              table td {
                padding: 14px;
                border: 1px solid #e4e2df;
                font-size: 14px;
              }
              table td:first-child {
                font-weight: 600;
                color: #7a0901;
                width: 35%;
              }
              .reason-box {
                background-color: #f4f1ec;
                padding: 20px;
                border-radius: 6px;
                margin: 20px 0;
              }
              .reason-title {
                color: #7a0901;
                font-weight: 600;
                margin-bottom: 10px;
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
                box-shadow: 0 4px 12px rgba(122, 9, 1, 0.25);
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
                <p class="greeting">${greeting},</p>
                
                <div class="warning-banner">
                  <div class="warning-title">✗ The following appointment has been cancelled</div>
                </div>
                
                <h2 style="color: #7a0901; margin: 25px 0 15px 0; font-size: 20px;">Cancelled Appointment Details</h2>
                ${formatAppointmentDetails(details)}
                
                ${
                  cancellationReason
                    ? `
                <div class="reason-box">
                  <div class="reason-title">Reason for Cancellation</div>
                  <p style="color: #5c504b; font-size: 14px;">${cancellationReason}</p>
                </div>
                `
                    : ""
                }
                
                <p class="message">If you need to reschedule or have any questions, please contact our support team.</p>
                
                <div class="button-container">
                  <a href="${FRONTEND_URL}/my-appointments" class="button">Book a New Appointment</a>
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
${greeting},

The following appointment has been cancelled:

Appointment Details:
- Appointment ID: ${details.appointmentId}
- Service: ${details.jobName}
- Date: ${details.appointmentDate}
- Time: ${details.appointmentStartTime.slice(0, 5)} - ${details.appointmentEndTime.slice(0, 5)}
- Technician: ${details.technicianName}
- Customer: ${details.customerName}

${cancellationReason ? `Reason: ${cancellationReason}` : ""}

If you need to reschedule or have any questions, please contact our support team.

Best regards,
The Profroid Team
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(
        `Appointment cancelled notification sent to ${recipient.email}`,
      );
    } catch (error) {
      console.error(
        `Failed to send appointment cancelled notification to ${recipient.email}:`,
        error,
      );
      throw new Error(
        `Failed to send appointment cancellation notification to ${recipient.email}`,
      );
    }
  }
}

/**
 * Send appointment update notification when details have changed
 */
export async function sendAppointmentUpdatedNotification(
  recipients: NotificationRecipient[],
  details: AppointmentDetails,
  changedFields: string[],
): Promise<void> {
  const transporter = createTransporter();

  // Format changed fields for display
  const changedFieldsDisplay = changedFields
    .map((field) => {
      const fieldMap: Record<string, string> = {
        appointmentDate: "Appointment Date",
        appointmentStartTime: "Start Time",
        appointmentEndTime: "End Time",
        technician: "Assigned Technician",
        customer: "Customer",
        jobName: "Service Type",
        description: "Description",
        appointmentAddress: "Location",
        cellarName: "Cellar",
      };
      return fieldMap[field] || field;
    })
    .join(", ");

  for (const recipient of recipients) {
    const greeting =
      recipient.role === "customer" ? "Dear Customer" : "Dear Technician";
    // Use role-specific appointment view URL
    const appointmentUrl =
      recipient.role === "customer"
        ? `${FRONTEND_URL}/my-appointments`
        : `${FRONTEND_URL}/my-jobs`;

    const mailOptions = {
      from: SMTP_FROM,
      to: recipient.email,
      subject: `Appointment Updated - ${details.jobName} on ${details.appointmentDate}`,
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
                background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
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
              .info-banner {
                background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
                border-left: 4px solid #007bff;
                padding: 20px;
                margin: 25px 0;
                border-radius: 4px;
              }
              .info-title {
                color: #0056b3;
                font-weight: 600;
                font-size: 16px;
                margin-bottom: 10px;
              }
              .changed-fields {
                color: #1976d2;
                font-size: 14px;
                font-weight: 500;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
                background-color: #ffffff;
                border-radius: 6px;
                overflow: hidden;
              }
              table tr:nth-child(odd) {
                background-color: #f4f1ec;
              }
              table td {
                padding: 14px;
                border: 1px solid #e4e2df;
                font-size: 14px;
              }
              table td:first-child {
                font-weight: 600;
                color: #7a0901;
                width: 35%;
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
                box-shadow: 0 4px 12px rgba(122, 9, 1, 0.25);
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
                <p class="greeting">${greeting},</p>
                
                <div class="info-banner">
                  <div class="info-title">⚡ Your appointment has been updated</div>
                  <div class="changed-fields">Changed: ${changedFieldsDisplay}</div>
                </div>
                
                <h2 style="color: #7a0901; margin: 25px 0 15px 0; font-size: 20px;">Updated Appointment Details</h2>
                ${formatAppointmentDetails(details)}
                
                <p class="message">Please review the updated information carefully. If you have any questions or concerns, please contact us immediately.</p>
                
                <div class="button-container">
                  <a href="${appointmentUrl}" class="button">${recipient.role === "customer" ? "View Your Appointments" : "View Your Jobs"}</a>
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
${greeting},

Your appointment has been updated. The following details have changed:
${changedFieldsDisplay}

Updated Appointment Details:
- Appointment ID: ${details.appointmentId}
- Service: ${details.jobName}
- Date: ${details.appointmentDate}
- Time: ${details.appointmentStartTime.slice(0, 5)} - ${details.appointmentEndTime.slice(0, 5)}
- Location: ${
        details.appointmentAddress
          ? `${details.appointmentAddress.street || ""}, ${details.appointmentAddress.city || ""}`
          : "Not specified"
      }
- Technician: ${details.technicianName}
- Customer: ${details.customerName}

Please review the updated information carefully. If you have any questions, please contact us.

Best regards,
The Profroid Team
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(
        `Appointment updated notification sent to ${recipient.email}`,
      );
    } catch (error) {
      console.error(
        `Failed to send appointment updated notification to ${recipient.email}:`,
        error,
      );
      throw new Error(
        `Failed to send appointment update notification to ${recipient.email}`,
      );
    }
  }
}

/**
 * Send appointment reminder notification
 */
export async function sendAppointmentReminderNotification(
  recipient: NotificationRecipient,
  details: AppointmentDetails,
  hoursUntilAppointment: number,
): Promise<void> {
  const transporter = createTransporter();

  const greeting =
    recipient.role === "customer" ? "Dear Customer" : "Dear Technician";
  const reminderText =
    hoursUntilAppointment <= 24
      ? "upcoming appointment tomorrow"
      : `appointment in ${hoursUntilAppointment} hours`;

  const mailOptions = {
    from: SMTP_FROM,
    to: recipient.email,
    subject: `Reminder: Your ${reminderText} - ${details.jobName}`,
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
              background: linear-gradient(135deg, #ffa726 0%, #fb8c00 100%);
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
              color: #ffffff;
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
            .reminder-banner {
              background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);
              border-left: 4px solid #ffa726;
              padding: 20px;
              margin: 25px 0;
              border-radius: 4px;
              text-align: center;
            }
            .reminder-icon {
              font-size: 36px;
              margin-bottom: 10px;
            }
            .reminder-title {
              color: #e65100;
              font-weight: 600;
              font-size: 16px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
              background-color: #ffffff;
              border-radius: 6px;
              overflow: hidden;
            }
            table tr:nth-child(odd) {
              background-color: #f4f1ec;
            }
            table td {
              padding: 14px;
              border: 1px solid #e4e2df;
              font-size: 14px;
            }
            table td:first-child {
              font-weight: 600;
              color: #7a0901;
              width: 35%;
            }
            .important-note {
              background-color: #fff4e6;
              padding: 15px;
              border-radius: 6px;
              margin: 20px 0;
              text-align: center;
              font-weight: 600;
              color: #e65100;
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
              box-shadow: 0 4px 12px rgba(122, 9, 1, 0.25);
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
              <p class="greeting">${greeting},</p>
              
              <div class="reminder-banner">
                <div class="reminder-icon">🔔</div>
                <div class="reminder-title">This is a reminder about your ${reminderText}</div>
              </div>
              
              <h2 style="color: #7a0901; margin: 25px 0 15px 0; font-size: 20px;">Appointment Details</h2>
              ${formatAppointmentDetails(details)}
              
              <div class="important-note">
                ⏰ Please arrive on time and bring any necessary documents or items
              </div>
              
              <div class="button-container">
                <a href="${recipient.role === "customer" ? FRONTEND_URL + "/my-appointments" : FRONTEND_URL + "/my-jobs"}" class="button">${recipient.role === "customer" ? "View Your Appointments" : "View Your Jobs"}</a>
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
${greeting},

This is a reminder about your ${reminderText}.

Appointment Details:
- Appointment ID: ${details.appointmentId}
- Service: ${details.jobName}
- Date: ${details.appointmentDate}
- Time: ${details.appointmentStartTime.slice(0, 5)} - ${details.appointmentEndTime.slice(0, 5)}
- Location: ${
      details.appointmentAddress
        ? `${details.appointmentAddress.street || ""}, ${details.appointmentAddress.city || ""}`
        : "Not specified"
    }
- Technician: ${details.technicianName}

Please arrive on time and bring any necessary documents or items.

Best regards,
The Profroid Team
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Appointment reminder notification sent to ${recipient.email}`);
  } catch (error) {
    console.error(
      `Failed to send appointment reminder notification to ${recipient.email}:`,
      error,
    );
    throw new Error(
      `Failed to send appointment reminder notification to ${recipient.email}`,
    );
  }
}

/**
 * Send appointment canceled notification when customer is reassigned (unassigned from appointment)
 * This differs from full appointment cancellation - the appointment still exists but customer no longer assigned
 */
export async function sendAppointmentCanceledFromReassignmentNotification(
  recipient: NotificationRecipient,
  details: AppointmentDetails,
): Promise<void> {
  const transporter = createTransporter();

  const greeting =
    recipient.role === "customer" ? "Dear Customer" : "Dear Technician";
  // Use role-specific appointment view URL
  const appointmentUrl =
    recipient.role === "customer"
      ? `${FRONTEND_URL}/my-appointments`
      : `${FRONTEND_URL}/my-jobs`;

  const mailOptions = {
    from: SMTP_FROM,
    to: recipient.email,
    subject: `Appointment Reassigned - ${details.jobName}`,
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
              background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
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
            .warning-banner {
              background-color: #fff4e6;
              border-left: 4px solid #dc3545;
              padding: 20px;
              margin: 25px 0;
              border-radius: 4px;
            }
            .warning-title {
              color: #c82333;
              font-weight: 600;
              font-size: 16px;
            }
            .info-box {
              background-color: #f4f1ec;
              padding: 20px;
              margin: 20px 0;
              border-left: 4px solid #7a0901;
              border-radius: 4px;
            }
            .info-row {
              margin: 10px 0;
              color: #5c504b;
              font-size: 14px;
            }
            .info-label {
              font-weight: 600;
              color: #7a0901;
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
              box-shadow: 0 4px 12px rgba(122, 9, 1, 0.25);
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
              <p class="greeting">${greeting},</p>
              
              <div class="warning-banner">
                <div class="warning-title">⚠️ Your appointment has been reassigned and is no longer assigned to you</div>
              </div>
              
              <div class="info-box">
                <div class="info-row"><span class="info-label">Appointment ID:</span> ${details.appointmentId}</div>
                <div class="info-row"><span class="info-label">Service:</span> ${details.jobName}</div>
              </div>
              
              <p class="message">This appointment has been reassigned to another ${recipient.role === "customer" ? "customer" : "technician"}. You are no longer responsible for this appointment.</p>
              
              <p class="message">If you have any questions, please contact our support team.</p>
              
              <div class="button-container">
                <a href="${appointmentUrl}" class="button">${recipient.role === "customer" ? "View Your Appointments" : "View Your Jobs"}</a>
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
${greeting}

Your appointment has been reassigned and is no longer assigned to you.

Appointment ID: ${details.appointmentId}
Service: ${details.jobName}

This appointment has been reassigned to another ${recipient.role === "customer" ? "customer" : "technician"}. You are no longer responsible for this appointment.

If you have any questions, please contact our support team.

Best regards,
The Profroid Team
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(
      `Appointment reassigned notification sent to ${recipient.email}`,
    );
  } catch (error) {
    console.error(
      `Failed to send appointment reassigned notification to ${recipient.email}:`,
      error,
    );
    throw new Error(
      `Failed to send appointment reassigned notification to ${recipient.email}`,
    );
  }
}

/**
 * Send appointment confirmed notification when a new customer is assigned to an appointment
 * This is similar to booking confirmation but indicates assignment rather than initial booking
 */
export async function sendAppointmentConfirmedNotification(
  recipient: NotificationRecipient,
  details: AppointmentDetails,
): Promise<void> {
  const transporter = createTransporter();

  // Use role-specific appointment view URL
  const appointmentUrl =
    recipient.role === "customer"
      ? `${FRONTEND_URL}/my-appointments`
      : `${FRONTEND_URL}/my-jobs`;

  const mailOptions = {
    from: SMTP_FROM,
    to: recipient.email,
    subject: `Appointment Confirmed - ${details.jobName} on ${details.appointmentDate}`,
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
            }
            .success-title {
              color: #2e7d32;
              font-weight: 600;
              font-size: 16px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
              background-color: #ffffff;
              border-radius: 6px;
              overflow: hidden;
            }
            table tr:nth-child(odd) {
              background-color: #f4f1ec;
            }
            table td {
              padding: 14px;
              border: 1px solid #e4e2df;
              font-size: 14px;
            }
            table td:first-child {
              font-weight: 600;
              color: #7a0901;
              width: 35%;
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
              box-shadow: 0 4px 12px rgba(122, 9, 1, 0.25);
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
              <p class="greeting">Dear ${recipient.role === "customer" ? "Customer" : "Technician"},</p>
              
              <div class="success-banner">
                <div class="success-title">✓ Your appointment has been confirmed with our team</div>
              </div>
              
              <h2 style="color: #7a0901; margin: 25px 0 15px 0; font-size: 20px;">Appointment Details</h2>
              ${formatAppointmentDetails(details)}
              
              <p class="message">Please make sure to arrive on time. If you need to reschedule or cancel this appointment, please contact us as soon as possible.</p>
              
              <div class="button-container">
                <a href="${appointmentUrl}" class="button">${recipient.role === "customer" ? "View Your Appointments" : "View Your Jobs"}</a>
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
Dear Customer,

Your appointment has been confirmed with our team.

Appointment Details:
- Appointment ID: ${details.appointmentId}
- Service: ${details.jobName}
- Date: ${details.appointmentDate}
- Time: ${details.appointmentStartTime.slice(0, 5)} - ${details.appointmentEndTime.slice(0, 5)}
- Location: ${
      details.appointmentAddress
        ? `${details.appointmentAddress.street || ""}, ${details.appointmentAddress.city || ""}, ${details.appointmentAddress.province || ""}`
        : "Not specified"
    }
- Technician: ${details.technicianName}

Please make sure to arrive on time. If you need to reschedule or cancel this appointment, please contact us as soon as possible.

Best regards,
The Profroid Team
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(
      `Appointment confirmed notification sent to ${recipient.email}`,
    );
  } catch (error) {
    console.error(
      `Failed to send appointment confirmed notification to ${recipient.email}:`,
      error,
    );
    throw new Error(
      `Failed to send appointment confirmed notification to ${recipient.email}`,
    );
  }
}

export type { AppointmentDetails, NotificationRecipient };
