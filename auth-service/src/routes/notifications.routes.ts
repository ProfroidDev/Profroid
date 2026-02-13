import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
import {
  sendAppointmentBookedNotification,
  sendAppointmentCancelledNotification,
  sendAppointmentUpdatedNotification,
  sendAppointmentReminderNotification,
  sendAppointmentCanceledFromReassignmentNotification,
  sendAppointmentConfirmedNotification,
  type AppointmentDetails,
  type NotificationRecipient,
} from "../services/appointmentNotification.service.js";
import {
  sendPaymentPaidNotification,
  type PaymentDetails,
  type PaymentNotificationRecipient,
} from "../services/paymentNotification.service.js";

const router = Router();

type PaymentCustomerInput = {
  userId?: string;
  email?: string;
  name: string;
};

/**
 * Helper function to convert userId to email
 */
async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    return user?.email || null;
  } catch (error) {
    console.error(`Failed to lookup email for userId ${userId}:`, error);
    return null;
  }
}

/**
 * Helper function to get user language preference
 */
async function getUserLanguagePreference(userId: string): Promise<"en" | "fr"> {
  try {
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { preferredLanguage: true },
    });
    if (userProfile?.preferredLanguage === "fr") {
      return "fr";
    }
    return "en";
  } catch (error) {
    console.error(`Failed to lookup language preference for userId ${userId}:`, error);
    return "en";
  }
}

/**
 * Helper function to enrich recipients with email addresses and language preferences from userId
 */
async function enrichRecipientsWithEmails(recipients: any[]): Promise<any[]> {
  return Promise.all(
    recipients.map(async (recipient) => {
      let enriched = { ...recipient };
      
      // If recipient already has email, use it; otherwise look it up
      if (!recipient.email && recipient.userId) {
        const email = await getUserEmail(recipient.userId);
        enriched.email = email || `user-${recipient.userId}@example.com`;
      }
      
      // If recipient has userId, look up language preference
      if (recipient.userId && !recipient.preferredLanguage) {
        const language = await getUserLanguagePreference(recipient.userId);
        enriched.preferredLanguage = language;
      }
      
      return enriched;
    })
  );
}

/**
 * Helper function to fetch admin recipients
 */
async function getAdminRecipients(): Promise<PaymentNotificationRecipient[]> {
  try {
    const adminProfiles = await prisma.userProfile.findMany({
      where: {
        role: "admin",
        isActive: true,
        user: {
          email: { not: null },
        },
      },
      select: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    return adminProfiles
      .map((profile) => profile.user?.email)
      .filter((email): email is string => Boolean(email))
      .map((email) => ({
        email,
        name: "Admin",
        role: "admin",
      }));
  } catch (error) {
    console.error("Failed to load admin recipients:", error);
    return [];
  }
}

/**
 * POST /api/notifications/appointment/booked
 * Send appointment booked notifications to customer and technician
 * Request body:
 * {
 *   recipients: [{ userId, name, role: "customer" | "technician" }],
 *   details: { appointmentId, jobName, technicianName, customerName, ... }
 * }
 */
router.post("/appointment/booked", async (req: Request, res: Response) => {
  try {
    const { recipients, details } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Recipients array is required and must not be empty",
      });
    }

    if (!details || !details.appointmentId) {
      return res.status(400).json({
        success: false,
        error: "Appointment details with appointmentId are required",
      });
    }

    // Enrich recipients with email addresses and language preferences
    const enrichedRecipients = await enrichRecipientsWithEmails(recipients);

    // Send notification to each recipient with their preferred language
    for (const recipient of enrichedRecipients) {
      const language = recipient.preferredLanguage || "en";
      await sendAppointmentBookedNotification([recipient], details, language);
    }

    return res.json({
      success: true,
      message: "Appointment booked notifications sent successfully",
    });
  } catch (error) {
    console.error("Error sending appointment booked notification:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to send notifications",
    });
  }
});

/**
 * POST /api/notifications/appointment/cancelled
 * Send appointment cancellation notifications to customer and technician
 * Request body:
 * {
 *   recipients: [{ userId, name, role: "customer" | "technician" }],
 *   details: { appointmentId, jobName, technicianName, customerName, ... },
 *   cancellationReason?: string
 * }
 */
router.post("/appointment/cancelled", async (req: Request, res: Response) => {
  try {
    const { recipients, details, cancellationReason } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Recipients array is required and must not be empty",
      });
    }

    if (!details || !details.appointmentId) {
      return res.status(400).json({
        success: false,
        error: "Appointment details with appointmentId are required",
      });
    }

    // Enrich recipients with email addresses and language preferences
    const enrichedRecipients = await enrichRecipientsWithEmails(recipients);

    // Send notification to each recipient with their preferred language
    for (const recipient of enrichedRecipients) {
      const language = recipient.preferredLanguage || "en";
      await sendAppointmentCancelledNotification([recipient], details, cancellationReason, language);
    }

    return res.json({
      success: true,
      message: "Appointment cancelled notifications sent successfully",
    });
  } catch (error) {
    console.error("Error sending appointment cancelled notification:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to send notifications",
    });
  }
});

/**
 * POST /api/notifications/appointment/updated
 * Send appointment update notifications when details have changed
 * Request body:
 * {
 *   recipients: [{ userId, name, role: "customer" | "technician" }],
 *   details: { appointmentId, jobName, technicianName, customerName, ... },
 *   changedFields: ["appointmentDate", "appointmentStartTime", "technician", ...]
 * }
 */
router.post("/appointment/updated", async (req: Request, res: Response) => {
  try {
    const { recipients, details, changedFields } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Recipients array is required and must not be empty",
      });
    }

    if (!details || !details.appointmentId) {
      return res.status(400).json({
        success: false,
        error: "Appointment details with appointmentId are required",
      });
    }

    if (!changedFields || !Array.isArray(changedFields) || changedFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: "changedFields array is required and must not be empty",
      });
    }

    // Enrich recipients with email addresses and language preferences
    const enrichedRecipients = await enrichRecipientsWithEmails(recipients);

    // Send notification to each recipient with their preferred language
    for (const recipient of enrichedRecipients) {
      const language = recipient.preferredLanguage || "en";
      await sendAppointmentUpdatedNotification([recipient], details, changedFields, language);
    }

    return res.json({
      success: true,
      message: "Appointment updated notifications sent successfully",
    });
  } catch (error) {
    console.error("Error sending appointment updated notification:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to send notifications",
    });
  }
});

/**
 * POST /api/notifications/appointment/reminder
 * Send appointment reminder notifications
 * Request body:
 * {
 *   recipient: { userId, name, role: "customer" | "technician" },
 *   details: { appointmentId, jobName, technicianName, customerName, ... },
 *   hoursUntilAppointment: number
 * }
 */
router.post("/appointment/reminder", async (req: Request, res: Response) => {
  try {
    const { recipient, details, hoursUntilAppointment } = req.body;

    if (!recipient || !recipient.name) {
      return res.status(400).json({
        success: false,
        error: "Recipient with name and either email or userId is required",
      });
    }

    if (!details || !details.appointmentId) {
      return res.status(400).json({
        success: false,
        error: "Appointment details with appointmentId are required",
      });
    }

    if (typeof hoursUntilAppointment !== "number" || hoursUntilAppointment < 0) {
      return res.status(400).json({
        success: false,
        error: "hoursUntilAppointment must be a non-negative number",
      });
    }

    // Enrich recipient with email address and language preference if needed
    let enrichedRecipient = recipient;
    if (!recipient.email && recipient.userId) {
      const email = await getUserEmail(recipient.userId);
      enrichedRecipient = {
        ...recipient,
        email: email || `user-${recipient.userId}@example.com`,
      };
    }
    
    // Get language preference if not already provided
    if (recipient.userId && !enrichedRecipient.preferredLanguage) {
      const language = await getUserLanguagePreference(recipient.userId);
      enrichedRecipient = {
        ...enrichedRecipient,
        preferredLanguage: language,
      };
    }

    const language = enrichedRecipient.preferredLanguage || "en";
    await sendAppointmentReminderNotification(enrichedRecipient, details, hoursUntilAppointment, language);

    return res.json({
      success: true,
      message: "Appointment reminder notification sent successfully",
    });
  } catch (error) {
    console.error("Error sending appointment reminder notification:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to send notification",
    });
  }
});

/**
 * POST /api/notifications/payment/paid
 * Send payment confirmation notifications to customer and admin
 * Request body:
 * {
 *   customer: { userId, name, role: "customer" },
 *   details: { billId, amount, status, paidAt, appointmentId, jobName, reportId, ... }
 * }
 */
router.post("/payment/paid", async (req: Request, res: Response) => {
  try {
    const { customer, details } = req.body as {
      customer: PaymentCustomerInput;
      details: PaymentDetails;
    };

    if (!customer || !customer.name) {
      return res.status(400).json({
        success: false,
        error: "Customer with name and either email or userId is required",
      });
    }

    if (!customer.email && !customer.userId) {
      return res.status(400).json({
        success: false,
        error: "Customer with email or userId is required",
      });
    }

    if (!details || !details.billId) {
      return res.status(400).json({
        success: false,
        error: "Payment details with billId are required",
      });
    }

    let enrichedCustomer: PaymentNotificationRecipient = {
      email: customer.email || "",
      name: customer.name,
      role: "customer",
    };

    if (!customer.email && customer.userId) {
      const email = await getUserEmail(customer.userId);
      enrichedCustomer = {
        email: email || `user-${customer.userId}@example.com`,
        name: customer.name,
        role: "customer",
      };
    }

    const adminRecipients = await getAdminRecipients();
    const combinedRecipients = [enrichedCustomer, ...adminRecipients];
    const uniqueRecipients = Array.from(
      new Map(combinedRecipients.map((recipient) => [recipient.email, recipient])).values(),
    );

    const enrichedDetails: PaymentDetails = {
      ...details,
      customerName: details.customerName || customer.name,
      customerEmail: details.customerEmail || enrichedCustomer.email,
    };

    await sendPaymentPaidNotification(uniqueRecipients, enrichedDetails);

    return res.json({
      success: true,
      message: "Payment confirmation notifications sent successfully",
    });
  } catch (error) {
    console.error("Error sending payment confirmation notification:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to send notification",
    });
  }
});

/**
 * POST /api/notifications/appointment/assigned
 * Send notification when a customer is newly assigned to an appointment
 * Sends "Appointment Confirmed" notification
 * Request body:
 * {
 *   recipient: { userId, name, role: "customer" | "technician" },
 *   details: { appointmentId, jobName, technicianName, customerName, ... },
 *   notificationType: "customer_assigned" | "technician_assigned"
 * }
 */
router.post("/appointment/assigned", async (req: Request, res: Response) => {
  try {
    const { recipient, details, notificationType } = req.body;

    if (!recipient || !recipient.name) {
      return res.status(400).json({
        success: false,
        error: "Recipient with name and either email or userId is required",
      });
    }

    if (!details || !details.appointmentId) {
      return res.status(400).json({
        success: false,
        error: "Appointment details with appointmentId are required",
      });
    }

    // Enrich recipient with email address and language preference if needed
    let enrichedRecipient = recipient;
    if (!recipient.email && recipient.userId) {
      const email = await getUserEmail(recipient.userId);
      enrichedRecipient = {
        ...recipient,
        email: email || `user-${recipient.userId}@example.com`,
      };
    }
    
    // Get language preference if not already provided
    if (recipient.userId && !enrichedRecipient.preferredLanguage) {
      const language = await getUserLanguagePreference(recipient.userId);
      enrichedRecipient = {
        ...enrichedRecipient,
        preferredLanguage: language,
      };
    }

    // For customer assignments, send appointment confirmed notification
    // For technician assignments, send the appointment confirmed notification as well
    const assignedNotification: NotificationRecipient = enrichedRecipient;
    const language = enrichedRecipient.preferredLanguage || "en";
    
    if (notificationType === "customer_assigned" || recipient.role === "customer") {
      // Send "Appointment Confirmed" notification to newly assigned customer
      await sendAppointmentConfirmedNotification(assignedNotification, details, language);
    } else {
      // For technician, also send confirmation (can be used similarly)
      await sendAppointmentConfirmedNotification(assignedNotification, details, language);
    }

    return res.json({
      success: true,
      message: `${recipient.role} assigned to appointment successfully`,
    });
  } catch (error) {
    console.error("Error sending assignment notification:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to send notification",
    });
  }
});

/**
 * POST /api/notifications/appointment/unassigned
 * Send notification when a customer is unassigned from an appointment (reassignment)
 * Sends "Appointment Reassigned" notification
 * Request body:
 * {
 *   recipient: { userId, name, role: "customer" | "technician" },
 *   details: { appointmentId, jobName, ... },
 *   notificationType: "customer_unassigned" | "technician_unassigned"
 * }
 */
router.post("/appointment/unassigned", async (req: Request, res: Response) => {
  try {
    const { recipient, details, notificationType } = req.body;

    if (!recipient || !recipient.name) {
      return res.status(400).json({
        success: false,
        error: "Recipient with name and either email or userId is required",
      });
    }

    if (!details || !details.appointmentId) {
      return res.status(400).json({
        success: false,
        error: "Appointment details with appointmentId are required",
      });
    }

    // Enrich recipient with email address and language preference if needed
    let enrichedRecipient = recipient;
    if (!recipient.email && recipient.userId) {
      const email = await getUserEmail(recipient.userId);
      enrichedRecipient = {
        ...recipient,
        email: email || `user-${recipient.userId}@example.com`,
      };
    }
    
    // Get language preference if not already provided
    if (recipient.userId && !enrichedRecipient.preferredLanguage) {
      const language = await getUserLanguagePreference(recipient.userId);
      enrichedRecipient = {
        ...enrichedRecipient,
        preferredLanguage: language,
      };
    }

    // For customer unassignment due to reassignment, send cancellation notification with minimal info
    const unassignedNotification: NotificationRecipient = enrichedRecipient;
    const language = enrichedRecipient.preferredLanguage || "en";
    
    if (notificationType === "customer_unassigned" || recipient.role === "customer") {
      // Send "Appointment Reassigned" notification to unassigned customer with minimal details
      await sendAppointmentCanceledFromReassignmentNotification(unassignedNotification, details, language);
    } else {
      // For technician unassignment
      await sendAppointmentCanceledFromReassignmentNotification(unassignedNotification, details, language);
    }

    return res.json({
      success: true,
      message: `${recipient.role} unassigned from appointment successfully`,
    });
  } catch (error) {
    console.error("Error sending unassignment notification:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to send notification",
    });
  }
});

export default router;
