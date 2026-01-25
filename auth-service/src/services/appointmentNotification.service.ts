import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || "";
const SMTP_FROM = process.env.SMTP_FROM || "noreply@profroid.com";
const FRONTEND_URL = process.env.FRONTEND_URLS?.split(",")[0] || "http://localhost:5173";

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
      ${details.cellarName ? `
      <tr>
        <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Cellar:</td>
        <td style="padding: 12px; border: 1px solid #ddd;">${details.cellarName}</td>
      </tr>
      ` : ""}
      ${details.description ? `
      <tr style="background-color: #f5f5f5;">
        <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold; vertical-align: top;">Notes:</td>
        <td style="padding: 12px; border: 1px solid #ddd;">${details.description}</td>
      </tr>
      ` : ""}
    </table>
  `;
}

/**
 * Send appointment booked notification to customer and technician
 */
export async function sendAppointmentBookedNotification(
  recipients: NotificationRecipient[],
  details: AppointmentDetails
): Promise<void> {
  const transporter = createTransporter();

  for (const recipient of recipients) {
    const greeting = recipient.role === "customer" ? "Dear Customer" : "Dear Technician";
    const roleMessage =
      recipient.role === "customer"
        ? "Your appointment has been successfully booked with our team."
        : "A new appointment has been assigned to you.";

    const mailOptions = {
      from: SMTP_FROM,
      to: recipient.email,
      subject: `Appointment Confirmed - ${details.jobName} on ${details.appointmentDate}`,
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
                <h1>✓ Appointment Confirmed</h1>
              </div>
              <div class="content">
                <p>${greeting},</p>
                
                <div class="success">
                  <strong>${roleMessage}</strong>
                </div>
                
                <h2>Appointment Details</h2>
                ${formatAppointmentDetails(details)}
                
                <p>Please make sure to arrive on time. If you need to reschedule or cancel this appointment, please contact us as soon as possible.</p>
                
                <div style="text-align: center;">
                  <a href="${FRONTEND_URL}/appointments" class="button">View Your Appointments</a>
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
      console.error(`Failed to send appointment booked notification to ${recipient.email}:`, error);
      throw new Error(`Failed to send appointment notification to ${recipient.email}`);
    }
  }
}

/**
 * Send appointment cancellation notification to customer and technician
 */
export async function sendAppointmentCancelledNotification(
  recipients: NotificationRecipient[],
  details: AppointmentDetails,
  cancellationReason?: string
): Promise<void> {
  const transporter = createTransporter();

  for (const recipient of recipients) {
    const greeting = recipient.role === "customer" ? "Dear Customer" : "Dear Technician";

    const mailOptions = {
      from: SMTP_FROM,
      to: recipient.email,
      subject: `Appointment Cancelled - ${details.jobName} on ${details.appointmentDate}`,
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
                background-color: #dc3545;
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
                background-color: #dc3545;
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
                background-color: #f8d7da;
                border: 1px solid #f5c6cb;
                padding: 15px;
                margin: 20px 0;
                border-radius: 5px;
                color: #721c24;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✗ Appointment Cancelled</h1>
              </div>
              <div class="content">
                <p>${greeting},</p>
                
                <div class="warning">
                  <strong>The following appointment has been cancelled:</strong>
                </div>
                
                <h2>Cancelled Appointment Details</h2>
                ${formatAppointmentDetails(details)}
                
                ${cancellationReason ? `<p><strong>Reason for Cancellation:</strong> ${cancellationReason}</p>` : ""}
                
                <p>If you need to reschedule or have any questions, please contact our support team.</p>
                
                <div style="text-align: center;">
                  <a href="${FRONTEND_URL}/appointments" class="button">Book a New Appointment</a>
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
      console.log(`Appointment cancelled notification sent to ${recipient.email}`);
    } catch (error) {
      console.error(`Failed to send appointment cancelled notification to ${recipient.email}:`, error);
      throw new Error(`Failed to send appointment cancellation notification to ${recipient.email}`);
    }
  }
}

/**
 * Send appointment update notification when details have changed
 */
export async function sendAppointmentUpdatedNotification(
  recipients: NotificationRecipient[],
  details: AppointmentDetails,
  changedFields: string[]
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
    const greeting = recipient.role === "customer" ? "Dear Customer" : "Dear Technician";

    const mailOptions = {
      from: SMTP_FROM,
      to: recipient.email,
      subject: `Appointment Updated - ${details.jobName} on ${details.appointmentDate}`,
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
                background-color: #007bff;
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
                background-color: #007bff;
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
              .info {
                background-color: #d1ecf1;
                border: 1px solid #bee5eb;
                padding: 15px;
                margin: 20px 0;
                border-radius: 5px;
                color: #0c5460;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>⚡ Appointment Updated</h1>
              </div>
              <div class="content">
                <p>${greeting},</p>
                
                <div class="info">
                  <strong>Your appointment has been updated. The following details have changed:</strong><br>
                  ${changedFieldsDisplay}
                </div>
                
                <h2>Updated Appointment Details</h2>
                ${formatAppointmentDetails(details)}
                
                <p>Please review the updated information carefully. If you have any questions or concerns, please contact us immediately.</p>
                
                <div style="text-align: center;">
                  <a href="${FRONTEND_URL}/appointments" class="button">View Your Appointments</a>
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
      console.log(`Appointment updated notification sent to ${recipient.email}`);
    } catch (error) {
      console.error(`Failed to send appointment updated notification to ${recipient.email}:`, error);
      throw new Error(`Failed to send appointment update notification to ${recipient.email}`);
    }
  }
}

/**
 * Send appointment reminder notification
 */
export async function sendAppointmentReminderNotification(
  recipient: NotificationRecipient,
  details: AppointmentDetails,
  hoursUntilAppointment: number
): Promise<void> {
  const transporter = createTransporter();

  const greeting = recipient.role === "customer" ? "Dear Customer" : "Dear Technician";
  const reminderText =
    hoursUntilAppointment <= 24 ? "upcoming appointment tomorrow" : `appointment in ${hoursUntilAppointment} hours`;

  const mailOptions = {
    from: SMTP_FROM,
    to: recipient.email,
    subject: `Reminder: Your ${reminderText} - ${details.jobName}`,
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
              background-color: #ffc107;
              color: #333;
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
              background-color: #ffc107;
              color: #333 !important;
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
            .reminder {
              background-color: #fff3cd;
              border: 1px solid #ffeeba;
              padding: 15px;
              margin: 20px 0;
              border-radius: 5px;
              color: #856404;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 Appointment Reminder</h1>
            </div>
            <div class="content">
              <p>${greeting},</p>
              
              <div class="reminder">
                <strong>This is a reminder about your ${reminderText}.</strong>
              </div>
              
              <h2>Appointment Details</h2>
              ${formatAppointmentDetails(details)}
              
              <p><strong>Please arrive on time and bring any necessary documents or items.</strong></p>
              
              <div style="text-align: center;">
                <a href="${FRONTEND_URL}/appointments" class="button">View Your Appointments</a>
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
    console.error(`Failed to send appointment reminder notification to ${recipient.email}:`, error);
    throw new Error(`Failed to send appointment reminder notification to ${recipient.email}`);
  }
}

export type { AppointmentDetails, NotificationRecipient };
