import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || "";
const SMTP_FROM = process.env.SMTP_FROM || "noreply@profroid.com";
const FRONTEND_URL =
  process.env.FRONTEND_URLS?.split(",")[0] || "http://localhost:5173";

export interface PaymentDetails {
  billId: string;
  status?: string;
  amount?: string;
  paidAt?: string;
  appointmentId?: string;
  appointmentDate?: string;
  jobName?: string;
  reportId?: string;
  reportInternalId?: number;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  paymentIntentId?: string;
  stripeSessionId?: string;
}

export interface PaymentNotificationRecipient {
  email: string;
  name: string;
  role: "customer" | "admin";
}

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

function buildRow(label: string, value?: string | number): string {
  if (value === undefined || value === null || value === "") {
    return "";
  }
  return `
    <tr>
      <td style="padding: 12px; border: 1px solid #e4e2df; font-weight: 600; color: #7a0901; width: 35%;">${label}</td>
      <td style="padding: 12px; border: 1px solid #e4e2df;">${value}</td>
    </tr>
  `;
}

function formatPaymentDetails(details: PaymentDetails, amountLabel = "Amount Paid"): string {
  return `
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #ffffff; border-radius: 6px; overflow: hidden;">
      ${buildRow("Bill ID", details.billId)}
      ${buildRow("Status", details.status)}
      ${buildRow(amountLabel, details.amount)}
      ${buildRow("Paid At", details.paidAt)}
      ${buildRow("Job", details.jobName)}
      ${buildRow("Appointment ID", details.appointmentId)}
      ${buildRow("Appointment Date", details.appointmentDate)}
      ${buildRow("Report ID", details.reportId)}
      ${buildRow("Report Internal ID", details.reportInternalId)}
      ${buildRow("Customer", details.customerName)}
      ${buildRow("Customer Email", details.customerEmail)}
      ${buildRow("Customer ID", details.customerId)}
      ${buildRow("Payment Intent", details.paymentIntentId)}
      ${buildRow("Stripe Session", details.stripeSessionId)}
    </table>
  `;
}

export async function sendPaymentPaidNotification(
  recipients: PaymentNotificationRecipient[],
  details: PaymentDetails,
): Promise<void> {
  const transporter = createTransporter();

  for (const recipient of recipients) {
    const isAdmin = recipient.role === "admin";
    const title = isAdmin ? "Payment Received" : "Payment Confirmation";
    const intro = isAdmin
      ? "A customer payment has been marked as paid."
      : "Thank you for your payment. Here is your confirmation.";
    const actionUrl = isAdmin
      ? `${FRONTEND_URL}/service-reports`
      : `${FRONTEND_URL}/my-bills`;
    const actionLabel = isAdmin ? "View Service Reports" : "View My Bills";

    const mailOptions = {
      from: SMTP_FROM,
      to: recipient.email,
      subject: `${title} - Bill ${details.billId}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
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
              .highlight {
                background: linear-gradient(135deg, #e8f5e9 0%, #d4f1d9 100%);
                border-left: 4px solid #4caf50;
                padding: 18px;
                margin: 20px 0;
                border-radius: 4px;
                color: #2e7d32;
                font-weight: 600;
                font-size: 14px;
              }
              .button-container {
                text-align: center;
                margin: 30px 0;
              }
              .button {
                display: inline-block;
                padding: 14px 36px;
                background: linear-gradient(90deg, #7a0901 0%, #a32c1a 100%);
                color: #ffffff !important;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                font-size: 15px;
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
                margin-top: 12px;
              }
            </style>
          </head>
          <body>
            <div class="email-wrapper">
              <div class="header">
                <div class="logo">PROFROID</div>
                <div class="header-subtitle">Payment Confirmation</div>
              </div>
              <div class="content">
                <p class="greeting">Hello ${recipient.name || "there"},</p>
                <p class="message">${intro}</p>
                <div class="highlight">${title} for bill ${details.billId}.</div>
                ${formatPaymentDetails(details)}
                <div class="button-container">
                  <a href="${actionUrl}" class="button">${actionLabel}</a>
                </div>
              </div>
              <div class="footer">
                <p class="footer-text">This is an automated message from Profroid. Please do not reply.</p>
                <div class="footer-brand">PROFROID</div>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
${title}

${intro}

Bill ID: ${details.billId}
Status: ${details.status || ""}
Amount Paid: ${details.amount || ""}
Paid At: ${details.paidAt || ""}
Job: ${details.jobName || ""}
Appointment ID: ${details.appointmentId || ""}
Appointment Date: ${details.appointmentDate || ""}
Report ID: ${details.reportId || ""}
Report Internal ID: ${details.reportInternalId || ""}
Customer: ${details.customerName || ""}
Customer Email: ${details.customerEmail || ""}
Customer ID: ${details.customerId || ""}
Payment Intent: ${details.paymentIntentId || ""}
Stripe Session: ${details.stripeSessionId || ""}

${actionLabel}: ${actionUrl}
      `.trim(),
    };

    await transporter.sendMail(mailOptions);
  }
}

export async function sendPaymentDueNotification(
  recipients: PaymentNotificationRecipient[],
  details: PaymentDetails,
): Promise<void> {
  const transporter = createTransporter();

  for (const recipient of recipients) {
    const title = "Payment Due";
    const intro =
      "Your service report is complete and payment is now due. Please review your bill details.";
    const actionUrl = `${FRONTEND_URL}/my-bills`;
    const actionLabel = "View My Bills";

    const mailOptions = {
      from: SMTP_FROM,
      to: recipient.email,
      subject: `${title} - Bill ${details.billId}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
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
              .highlight {
                background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
                border-left: 4px solid #f57c00;
                padding: 18px;
                margin: 20px 0;
                border-radius: 4px;
                color: #8a3e00;
                font-weight: 600;
                font-size: 14px;
              }
              .button-container {
                text-align: center;
                margin: 30px 0;
              }
              .button {
                display: inline-block;
                padding: 14px 36px;
                background: linear-gradient(90deg, #7a0901 0%, #a32c1a 100%);
                color: #ffffff !important;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                font-size: 15px;
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
                margin-top: 12px;
              }
            </style>
          </head>
          <body>
            <div class="email-wrapper">
              <div class="header">
                <div class="logo">PROFROID</div>
                <div class="header-subtitle">Payment Due</div>
              </div>
              <div class="content">
                <p class="greeting">Hello ${recipient.name || "there"},</p>
                <p class="message">${intro}</p>
                <div class="highlight">${title} for bill ${details.billId}.</div>
                ${formatPaymentDetails(details, "Amount Due")}
                <div class="button-container">
                  <a href="${actionUrl}" class="button">${actionLabel}</a>
                </div>
              </div>
              <div class="footer">
                <p class="footer-text">This is an automated message from Profroid. Please do not reply.</p>
                <div class="footer-brand">PROFROID</div>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
${title}

${intro}

Bill ID: ${details.billId}
Status: ${details.status || ""}
Amount Due: ${details.amount || ""}
Job: ${details.jobName || ""}
Appointment ID: ${details.appointmentId || ""}
Appointment Date: ${details.appointmentDate || ""}
Report ID: ${details.reportId || ""}
Report Internal ID: ${details.reportInternalId || ""}
Customer: ${details.customerName || ""}
Customer Email: ${details.customerEmail || ""}
Customer ID: ${details.customerId || ""}

${actionLabel}: ${actionUrl}
      `.trim(),
    };

    await transporter.sendMail(mailOptions);
  }
}
