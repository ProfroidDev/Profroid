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
  jobNameFr?: string; // French translation of job name
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
  preferredLanguage?: "en" | "fr";
}

interface NotificationRecipient {
  email: string;
  name: string;
  role: "customer" | "technician";
}

/**
 * Get the appropriate job name based on language
 */
function getJobName(details: AppointmentDetails, language: "en" | "fr"): string {
  if (language === "fr" && details.jobNameFr) {
    return details.jobNameFr;
  }
  return details.jobName;
}

/**
 * Get validated language preference
 */
function getLanguage(lang?: string): "en" | "fr" {
  if (lang === "fr") return "fr";
  return "en";
}

/**
 * Format date according to language preference
 */
function formatDateForLanguage(dateString: string, language: "en" | "fr"): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Return original if invalid
    
    if (language === "fr") {
      // Format: "12 février 2026"
      return date.toLocaleDateString("fr-CA", { year: "numeric", month: "long", day: "numeric" });
    } else {
      // Format: "February 12, 2026"
      return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    }
  } catch {
    return dateString;
  }
}

/**
 * Format date phrase with language-specific preposition
 */
function formatDatePhrase(dateString: string, language: "en" | "fr"): string {
  const formattedDate = formatDateForLanguage(dateString, language);
  const preposition = language === "fr" ? "le" : "on";
  return `${preposition} ${formattedDate}`;
}

/**
 * Get appointment email strings in specified language
 */
function getAppointmentEmailStrings(language: "en" | "fr") {
  if (language === "fr") {
    return {
      // Common labels
      appointmentID: "ID de Rendez-vous",
      service: "Service",
      date: "Date",
      time: "Heure",
      location: "Emplacement",
      technician: "Technicien",
      customer: "Client",
      cellar: "Cave",
      notes: "Remarques",
      notSpecified: "Non spécifié",
      
      // Booked email
      bookedSubject: "Rendez-vous Confirmé",
      bookedGreetingCustomer: "Cher client",
      bookedGreetingTechnician: "Cher technicien",
      bookedMessageCustomer: "Votre rendez-vous a été confirmé auprès de notre équipe.",
      bookedMessageTechnician: "Un nouveau rendez-vous vous a été assigné.",
      bookedDetails: "Détails du Rendez-vous",
      bookedPleaseArrive: "Veuillez arriver à l'heure et apporter tous les documents ou articles nécessaires.",
      bookedViewAppointments: "Voir Vos Rendez-vous",
      bookedViewJobs: "Voir Vos Travaux",
      
      // Cancelled email
      cancelledSubject: "Rendez-vous Annulé",
      cancelledGreetingCustomer: "Cher client",
      cancelledGreetingTechnician: "Cher technicien",
      cancelledTitle: "Rendez-vous Annulé",
      cancelledMessage: "Le rendez-vous suivant a été annulé:",
      cancelledReason: "Raison",
      cancelledContact: "Si vous devez reporter ou avez des questions, veuillez contacter notre équipe d'assistance.",
      
      // Updated email
      updatedSubject: "Rendez-vous Mis à Jour",
      updatedGreetingCustomer: "Cher client",
      updatedGreetingTechnician: "Cher technicien",
      updatedTitle: "Rendez-vous Mis à Jour",
      updatedMessage: "Les détails de votre rendez-vous ont été modifiés:",
      updatedChangedFields: "Champs Modifiés",
      updatedContact: "Si vous avez des questions, veuillez contacter notre équipe d'assistance.",
      
      // Reminder email
      reminderSubject: "Rappel de Rendez-vous",
      reminderGreetingCustomer: "Cher client",
      reminderGreetingTechnician: "Cher technicien",
      reminderTitle: "Rappel de Rendez-vous",
      reminderTomorrow: "prochain rendez-vous demain",
      reminderInHours: "rendez-vous dans {hours} heures",
      reminderPlease: "Veuillez arriver à l'heure et apporter tous les documents ou articles nécessaires.",
      reminderViewAppointments: "Voir Vos Rendez-vous",
      reminderViewJobs: "Voir Vos Travaux",
      
      // Reassigned email
      reassignedSubject: "Rendez-vous Réassigné",
      reassignedTitle: "Rendez-vous Réassigné",
      reassignedMessage: "Ce rendez-vous a été réassigné à un autre {role}. Vous n'êtes plus responsable de ce rendez-vous.",
      reassignedContact: "Si vous avez des questions, veuillez contacter notre équipe d'assistance.",
      reassignedViewAppointments: "Voir Vos Rendez-vous",
      reassignedViewJobs: "Voir Vos Travaux",
      
      // Confirmed email
      confirmedSubject: "Rendez-vous Confirmé",
      confirmedGreetingCustomer: "Cher client",
      confirmedGreetingTechnician: "Cher technicien",
      confirmedTitle: "Rendez-vous Confirmé",
      confirmedMessage: "Votre rendez-vous a été confirmé auprès de notre équipe.",
      confirmedPleaseArrive: "Veuillez arriver à l'heure. Si vous devez reporter ou annuler ce rendez-vous, veuillez nous contacter dès que possible.",
      confirmedViewAppointments: "Voir Vos Rendez-vous",
      confirmedViewJobs: "Voir Vos Travaux",
      
      // Footer
      automatedEmail: "Ceci est un email automatisé de Profroid. Veuillez ne pas répondre à cet email.",
      allRightsReserved: "Tous les droits sont réservés à Profroid",
    };
  }
  
  // English (default)
  return {
    // Common labels
    appointmentID: "Appointment ID",
    service: "Service",
    date: "Date",
    time: "Time",
    location: "Location",
    technician: "Technician",
    customer: "Customer",
    cellar: "Cellar",
    notes: "Notes",
    notSpecified: "Not specified",
    
    // Booked email
    bookedSubject: "Appointment Confirmed",
    bookedGreetingCustomer: "Dear Customer",
    bookedGreetingTechnician: "Dear Technician",
    bookedMessageCustomer: "Your appointment has been successfully booked with our team.",
    bookedMessageTechnician: "A new appointment has been assigned to you.",
    bookedDetails: "Appointment Details",
    bookedPleaseArrive: "Please make sure to arrive on time. If you need to reschedule or cancel this appointment, please contact us as soon as possible.",
    bookedViewAppointments: "View Your Appointments",
    bookedViewJobs: "View Your Jobs",
    
    // Cancelled email
    cancelledSubject: "Appointment Cancelled",
    cancelledGreetingCustomer: "Dear Customer",
    cancelledGreetingTechnician: "Dear Technician",
    cancelledTitle: "Appointment Cancelled",
    cancelledMessage: "The following appointment has been cancelled:",
    cancelledReason: "Reason",
    cancelledContact: "If you need to reschedule or have any questions, please contact our support team.",
    
    // Updated email
    updatedSubject: "Appointment Updated",
    updatedGreetingCustomer: "Dear Customer",
    updatedGreetingTechnician: "Dear Technician",
    updatedTitle: "Appointment Updated",
    updatedMessage: "The details of your appointment have been changed:",
    updatedChangedFields: "Changed Fields",
    updatedContact: "If you have any questions, please contact our support team.",
    
    // Reminder email
    reminderSubject: "Appointment Reminder",
    reminderGreetingCustomer: "Dear Customer",
    reminderGreetingTechnician: "Dear Technician",
    reminderTitle: "Appointment Reminder",
    reminderTomorrow: "upcoming appointment tomorrow",
    reminderInHours: "appointment in {hours} hours",
    reminderPlease: "Please arrive on time and bring any necessary documents or items.",
    reminderViewAppointments: "View Your Appointments",
    reminderViewJobs: "View Your Jobs",
    
    // Reassigned email
    reassignedSubject: "Appointment Reassigned",
    reassignedTitle: "Appointment Reassigned",
    reassignedMessage: "This appointment has been reassigned to another {role}. You are no longer responsible for this appointment.",
    reassignedContact: "If you have any questions, please contact our support team.",
    reassignedViewAppointments: "View Your Appointments",
    reassignedViewJobs: "View Your Jobs",
    
    // Confirmed email
    confirmedSubject: "Appointment Confirmed",
    confirmedGreetingCustomer: "Dear Customer",
    confirmedGreetingTechnician: "Dear Technician",
    confirmedTitle: "Appointment Confirmed",
    confirmedMessage: "Your appointment has been confirmed with our team.",
    confirmedPleaseArrive: "Please make sure to arrive on time. If you need to reschedule or cancel this appointment, please contact us as soon as possible.",
    confirmedViewAppointments: "View Your Appointments",
    confirmedViewJobs: "View Your Jobs",
    
    // Footer
    automatedEmail: "This is an automated email from Profroid. Please do not reply to this email.",
    allRightsReserved: "All rights reserved to Profroid",
  };
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
function formatAppointmentDetails(details: AppointmentDetails, language?: "en" | "fr"): string {
  const lang = getLanguage(language || details.preferredLanguage);
  const strings = getAppointmentEmailStrings(lang);
  const jobName = getJobName(details, lang);
  
  const startTime = details.appointmentStartTime.slice(0, 5);
  const endTime = details.appointmentEndTime.slice(0, 5);
  const address = details.appointmentAddress;
  const addressStr = address
    ? `${address.street || ""}, ${address.city || ""}, ${address.province || ""} ${address.postalCode || ""}`.trim()
    : strings.notSpecified;

  return `
    <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
      <tr style="background-color: #f5f5f5;">
        <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold; width: 35%;">${strings.appointmentID}:</td>
        <td style="padding: 12px; border: 1px solid #ddd;">${details.appointmentId}</td>
      </tr>
      <tr>
        <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">${strings.service}:</td>
        <td style="padding: 12px; border: 1px solid #ddd;">${jobName}</td>
      </tr>
      <tr style="background-color: #f5f5f5;">
        <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">${strings.date}:</td>
        <td style="padding: 12px; border: 1px solid #ddd;">${formatDateForLanguage(details.appointmentDate, lang)}</td>
      </tr>
      <tr>
        <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">${strings.time}:</td>
        <td style="padding: 12px; border: 1px solid #ddd;">${startTime} - ${endTime}</td>
      </tr>
      <tr style="background-color: #f5f5f5;">
        <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">${strings.location}:</td>
        <td style="padding: 12px; border: 1px solid #ddd;">${addressStr}</td>
      </tr>
      <tr>
        <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">${strings.technician}:</td>
        <td style="padding: 12px; border: 1px solid #ddd;">${details.technicianName}</td>
      </tr>
      <tr style="background-color: #f5f5f5;">
        <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">${strings.customer}:</td>
        <td style="padding: 12px; border: 1px solid #ddd;">${details.customerName}</td>
      </tr>
      ${details.cellarName ? `
      <tr>
        <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">${strings.cellar}:</td>
        <td style="padding: 12px; border: 1px solid #ddd;">${details.cellarName}</td>
      </tr>
      ` : ""}
      ${details.description ? `
      <tr style="background-color: #f5f5f5;">
        <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold; vertical-align: top;">${strings.notes}:</td>
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
  details: AppointmentDetails,
  language?: "en" | "fr"
): Promise<void> {
  const transporter = createTransporter();
  const lang = getLanguage(language || details.preferredLanguage);
  const strings = getAppointmentEmailStrings(lang);
  const jobName = getJobName(details, lang);

  for (const recipient of recipients) {
    const greeting = recipient.role === "customer" ? strings.bookedGreetingCustomer : strings.bookedGreetingTechnician;
    const roleMessage =
      recipient.role === "customer"
        ? strings.bookedMessageCustomer
        : strings.bookedMessageTechnician;
    
    // Use role-specific appointment view URL
    const appointmentUrl = recipient.role === "customer" 
      ? `${FRONTEND_URL}/my-appointments`
      : `${FRONTEND_URL}/my-jobs`;
    
    const buttonText = recipient.role === "customer" ? strings.bookedViewAppointments : strings.bookedViewJobs;

    const mailOptions = {
      from: SMTP_FROM,
      to: recipient.email,
      subject: `${strings.bookedSubject} - ${jobName} ${formatDatePhrase(details.appointmentDate, lang)}`,
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
                <h1>✓ ${strings.bookedSubject}</h1>
              </div>
              <div class="content">
                <p>${greeting},</p>
                
                <div class="success">
                  <strong>${roleMessage}</strong>
                </div>
                
                <h2>${strings.bookedDetails}</h2>
                ${formatAppointmentDetails(details, lang)}
                
                <p>${strings.bookedPleaseArrive}</p>
                
                <div style="text-align: center;">
                  <a href="${appointmentUrl}" class="button">${buttonText}</a>
                </div>
                
                <div class="footer">
                  <p>${strings.automatedEmail}</p>
                  <p>&copy; ${new Date().getFullYear()} Profroid. ${strings.allRightsReserved}.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
${greeting},

${roleMessage}

${strings.bookedDetails}:
- ${strings.appointmentID}: ${details.appointmentId}
- ${strings.service}: ${jobName}
- ${strings.date}: ${formatDateForLanguage(details.appointmentDate, lang)}
- ${strings.time}: ${details.appointmentStartTime.slice(0, 5)} - ${details.appointmentEndTime.slice(0, 5)}
- ${strings.location}: ${
        details.appointmentAddress
          ? `${details.appointmentAddress.street || ""}, ${details.appointmentAddress.city || ""}`
          : strings.notSpecified
      }
- ${strings.technician}: ${details.technicianName}
- ${strings.customer}: ${details.customerName}

${strings.bookedPleaseArrive}

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
  cancellationReason?: string,
  language?: "en" | "fr"
): Promise<void> {
  const transporter = createTransporter();
  const lang = getLanguage(language || details.preferredLanguage);
  const strings = getAppointmentEmailStrings(lang);
  const jobName = getJobName(details, lang);

  for (const recipient of recipients) {
    const greeting = recipient.role === "customer" ? strings.cancelledGreetingCustomer : strings.cancelledGreetingTechnician;
    const buttonText = recipient.role === "customer" ? strings.bookedViewAppointments : strings.bookedViewJobs;

    const mailOptions = {
      from: SMTP_FROM,
      to: recipient.email,
      subject: `${strings.cancelledSubject} - ${jobName} ${formatDatePhrase(details.appointmentDate, lang)}`,
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
                <h1>✗ ${strings.cancelledTitle}</h1>
              </div>
              <div class="content">
                <p>${greeting},</p>
                
                <div class="warning">
                  <strong>${strings.cancelledMessage}</strong>
                </div>
                
                <h2>${strings.cancelledTitle}</h2>
                ${formatAppointmentDetails(details, lang)}
                
                ${cancellationReason ? `<p><strong>${strings.cancelledReason}:</strong> ${cancellationReason}</p>` : ""}
                
                <p>${strings.cancelledContact}</p>
                
                <div style="text-align: center;">
                  <a href="${FRONTEND_URL}/my-appointments" class="button">${buttonText}</a>
                </div>
                
                <div class="footer">
                  <p>${strings.automatedEmail}</p>
                  <p>&copy; ${new Date().getFullYear()} Profroid. ${strings.allRightsReserved}.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
${greeting},

${strings.cancelledMessage}

${strings.cancelledTitle}:
- ${strings.appointmentID}: ${details.appointmentId}
- ${strings.service}: ${jobName}
- ${strings.date}: ${details.appointmentDate}
- ${strings.time}: ${details.appointmentStartTime.slice(0, 5)} - ${details.appointmentEndTime.slice(0, 5)}
- ${strings.technician}: ${details.technicianName}
- ${strings.customer}: ${details.customerName}

${cancellationReason ? `${strings.cancelledReason}: ${cancellationReason}` : ""}

${strings.cancelledContact}

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
  changedFields: string[],
  language?: "en" | "fr"
): Promise<void> {
  const transporter = createTransporter();
  const lang = getLanguage(language || details.preferredLanguage);
  const strings = getAppointmentEmailStrings(lang);
  const jobName = getJobName(details, lang);

  // Format changed fields for display with language-specific labels
  const fieldMapEn: Record<string, string> = {
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

  const fieldMapFr: Record<string, string> = {
    appointmentDate: "Date du Rendez-vous",
    appointmentStartTime: "Heure de Début",
    appointmentEndTime: "Heure de Fin",
    technician: "Technicien Assigné",
    customer: "Client",
    jobName: "Type de Service",
    description: "Description",
    appointmentAddress: "Emplacement",
    cellarName: "Cave",
  };

  const fieldMap = lang === "fr" ? fieldMapFr : fieldMapEn;

  const changedFieldsDisplay = changedFields
    .map((field) => fieldMap[field] || field)
    .join(", ");

  for (const recipient of recipients) {
    const greeting = recipient.role === "customer" ? strings.updatedGreetingCustomer : strings.updatedGreetingTechnician;
    // Use role-specific appointment view URL
    const appointmentUrl = recipient.role === "customer" 
      ? `${FRONTEND_URL}/my-appointments`
      : `${FRONTEND_URL}/my-jobs`;
    
    const buttonText = recipient.role === "customer" ? strings.bookedViewAppointments : strings.bookedViewJobs;

    const mailOptions = {
      from: SMTP_FROM,
      to: recipient.email,
      subject: `${strings.updatedSubject} - ${jobName} ${formatDatePhrase(details.appointmentDate, lang)}`,
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
                <h1>⚡ ${strings.updatedTitle}</h1>
              </div>
              <div class="content">
                <p>${greeting},</p>
                
                <div class="info">
                  <strong>${strings.updatedMessage} ${strings.updatedChangedFields}:</strong><br>
                  ${changedFieldsDisplay}
                </div>
                
                <h2>${strings.updatedTitle}</h2>
                ${formatAppointmentDetails(details, lang)}
                
                <p>${strings.updatedContact}</p>
                
                <div style="text-align: center;">
                  <a href="${appointmentUrl}" class="button">${buttonText}</a>
                </div>
                
                <div class="footer">
                  <p>${strings.automatedEmail}</p>
                  <p>&copy; ${new Date().getFullYear()} Profroid. ${strings.allRightsReserved}.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
${greeting},

${strings.updatedMessage} ${strings.updatedChangedFields}:
${changedFieldsDisplay}

${strings.updatedTitle}:
- ${strings.appointmentID}: ${details.appointmentId}
- ${strings.service}: ${jobName}
- ${strings.date}: ${formatDateForLanguage(details.appointmentDate, lang)}
- ${strings.time}: ${details.appointmentStartTime.slice(0, 5)} - ${details.appointmentEndTime.slice(0, 5)}
- ${strings.location}: ${
        details.appointmentAddress
          ? `${details.appointmentAddress.street || ""}, ${details.appointmentAddress.city || ""}`
          : strings.notSpecified
      }
- ${strings.technician}: ${details.technicianName}
- ${strings.customer}: ${details.customerName}

${strings.updatedContact}

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
  hoursUntilAppointment: number,
  language?: "en" | "fr"
): Promise<void> {
  const transporter = createTransporter();
  const lang = getLanguage(language || details.preferredLanguage);
  const strings = getAppointmentEmailStrings(lang);
  const jobName = getJobName(details, lang);

  const greeting = recipient.role === "customer" ? strings.reminderGreetingCustomer : strings.reminderGreetingTechnician;
  const reminderText =
    hoursUntilAppointment <= 24 ? strings.reminderTomorrow : strings.reminderInHours.replace("{hours}", hoursUntilAppointment.toString());
  
  const buttonText = recipient.role === "customer" ? strings.reminderViewAppointments : strings.reminderViewJobs;

  const mailOptions = {
    from: SMTP_FROM,
    to: recipient.email,
    subject: `${strings.reminderSubject}: Your ${reminderText} - ${jobName}`,
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
              <h1>🔔 ${strings.reminderTitle}</h1>
            </div>
            <div class="content">
              <p>${greeting},</p>
              
              <div class="reminder">
                <strong>${strings.reminderTitle}: ${reminderText}.</strong>
              </div>
              
              <h2>${strings.bookedDetails}</h2>
              ${formatAppointmentDetails(details, lang)}
              
              <p><strong>${strings.reminderPlease}</strong></p>
              
              <div style="text-align: center;">
                <a href="${recipient.role === "customer" ? FRONTEND_URL + "/my-appointments" : FRONTEND_URL + "/my-jobs"}" class="button">${buttonText}</a>
              </div>
              
              <div class="footer">
                <p>${strings.automatedEmail}</p>
                <p>&copy; ${new Date().getFullYear()} Profroid. ${strings.allRightsReserved}.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
${greeting},

${strings.reminderTitle}: ${reminderText}.

${strings.bookedDetails}:
- ${strings.appointmentID}: ${details.appointmentId}
- ${strings.service}: ${jobName}
- ${strings.date}: ${formatDateForLanguage(details.appointmentDate, lang)}
- ${strings.time}: ${details.appointmentStartTime.slice(0, 5)} - ${details.appointmentEndTime.slice(0, 5)}
- ${strings.location}: ${
        details.appointmentAddress
          ? `${details.appointmentAddress.street || ""}, ${details.appointmentAddress.city || ""}`
          : strings.notSpecified
      }
- ${strings.technician}: ${details.technicianName}

${strings.reminderPlease}

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

/**
 * Send appointment canceled notification when customer is reassigned (unassigned from appointment)
 * This differs from full appointment cancellation - the appointment still exists but customer no longer assigned
 */
export async function sendAppointmentCanceledFromReassignmentNotification(
  recipient: NotificationRecipient,
  details: AppointmentDetails,
  language?: "en" | "fr"
): Promise<void> {
  const transporter = createTransporter();
  const lang = getLanguage(language || details.preferredLanguage);
  const strings = getAppointmentEmailStrings(lang);
  const jobName = getJobName(details, lang);

  const greeting = recipient.role === "customer" ? strings.reassignedTitle : strings.reassignedTitle;
  // Use role-specific appointment view URL
  const appointmentUrl = recipient.role === "customer" 
    ? `${FRONTEND_URL}/my-appointments`
    : `${FRONTEND_URL}/my-jobs`;
  
  const roleText = recipient.role === "customer" ? "customer" : "technician";
  const buttonText = recipient.role === "customer" ? strings.reassignedViewAppointments : strings.reassignedViewJobs;

  const mailOptions = {
    from: SMTP_FROM,
    to: recipient.email,
    subject: `${strings.reassignedSubject} - ${jobName}`,
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
            .minimal-info {
              background-color: #f9f9f9;
              padding: 15px;
              margin: 15px 0;
              border-left: 4px solid #dc3545;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✗ ${strings.reassignedTitle}</h1>
            </div>
            <div class="content">
              <p>${greeting},</p>
              
              <div class="warning">
                <strong>${strings.reassignedTitle}</strong>
              </div>
              
              <div class="minimal-info">
                <p><strong>${strings.appointmentID}:</strong> ${details.appointmentId}</p>
                <p><strong>${strings.service}:</strong> ${jobName}</p>
              </div>
              
              <p>${strings.reassignedMessage.replace("{role}", roleText)}</p>
              
              <p>${strings.reassignedContact}</p>
              
              <div style="text-align: center;">
                <a href="${appointmentUrl}" class="button">${buttonText}</a>
              </div>
              
              <div class="footer">
                <p>${strings.automatedEmail}</p>
                <p>&copy; ${new Date().getFullYear()} Profroid. ${strings.allRightsReserved}.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
${greeting}

${strings.reassignedTitle}

${strings.appointmentID}: ${details.appointmentId}
${strings.service}: ${jobName}

${strings.reassignedMessage.replace("{role}", roleText)}

${strings.reassignedContact}

Best regards,
The Profroid Team
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Appointment reassigned notification sent to ${recipient.email}`);
  } catch (error) {
    console.error(`Failed to send appointment reassigned notification to ${recipient.email}:`, error);
    throw new Error(`Failed to send appointment reassigned notification to ${recipient.email}`);
  }
}

/**
 * Send appointment confirmed notification when a new customer is assigned to an appointment
 * This is similar to booking confirmation but indicates assignment rather than initial booking
 */
export async function sendAppointmentConfirmedNotification(
  recipient: NotificationRecipient,
  details: AppointmentDetails,
  language?: "en" | "fr"
): Promise<void> {
  const transporter = createTransporter();
  const lang = getLanguage(language || details.preferredLanguage);
  const strings = getAppointmentEmailStrings(lang);
  const jobName = getJobName(details, lang);

  // Use role-specific appointment view URL
  const appointmentUrl = recipient.role === "customer" 
    ? `${FRONTEND_URL}/my-appointments`
    : `${FRONTEND_URL}/my-jobs`;

  const greeting = recipient.role === "customer" ? strings.confirmedGreetingCustomer : strings.confirmedGreetingTechnician;
  const buttonText = recipient.role === "customer" ? strings.confirmedViewAppointments : strings.confirmedViewJobs;

  const mailOptions = {
    from: SMTP_FROM,
    to: recipient.email,
    subject: `${strings.confirmedSubject} - ${jobName} ${formatDatePhrase(details.appointmentDate, lang)}`,
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
              background-color: #28a745;
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
              background-color: #28a745;
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
              <h1>✓ ${strings.confirmedTitle}</h1>
            </div>
            <div class="content">
              <p>${greeting},</p>
              
              <div class="success">
                <strong>${strings.confirmedMessage}</strong>
              </div>
              
              <h2>${strings.bookedDetails}</h2>
              ${formatAppointmentDetails(details, lang)}
              
              <p>${strings.confirmedPleaseArrive}</p>
              
              <div style="text-align: center;">
                <a href="${appointmentUrl}" class="button">${buttonText}</a>
              </div>
              
              <div class="footer">
                <p>${strings.automatedEmail}</p>
                <p>&copy; ${new Date().getFullYear()} Profroid. ${strings.allRightsReserved}.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
${greeting},

${strings.confirmedMessage}

${strings.bookedDetails}:
- ${strings.appointmentID}: ${details.appointmentId}
- ${strings.service}: ${jobName}
- ${strings.date}: ${formatDateForLanguage(details.appointmentDate, lang)}
- ${strings.time}: ${details.appointmentStartTime.slice(0, 5)} - ${details.appointmentEndTime.slice(0, 5)}
- ${strings.location}: ${
        details.appointmentAddress
          ? `${details.appointmentAddress.street || ""}, ${details.appointmentAddress.city || ""}, ${details.appointmentAddress.province || ""}`
          : strings.notSpecified
      }
- ${strings.technician}: ${details.technicianName}

${strings.confirmedPleaseArrive}

Best regards,
The Profroid Team
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Appointment confirmed notification sent to ${recipient.email}`);
  } catch (error) {
    console.error(`Failed to send appointment confirmed notification to ${recipient.email}:`, error);
    throw new Error(`Failed to send appointment confirmed notification to ${recipient.email}`);
  }
}

export type { AppointmentDetails, NotificationRecipient };
