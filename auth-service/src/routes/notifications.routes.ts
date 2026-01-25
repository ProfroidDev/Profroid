import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
import {
  sendAppointmentBookedNotification,
  sendAppointmentCancelledNotification,
  sendAppointmentUpdatedNotification,
  sendAppointmentReminderNotification,
  type AppointmentDetails,
  type NotificationRecipient,
} from "../services/appointmentNotification.service.js";

const router = Router();

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
 * Helper function to enrich recipients with email addresses from userId
 */
async function enrichRecipientsWithEmails(recipients: any[]): Promise<any[]> {
  return Promise.all(
    recipients.map(async (recipient) => {
      // If recipient already has email, return as-is
      if (recipient.email) {
        return recipient;
      }
      // If recipient has userId, look up email
      if (recipient.userId) {
        const email = await getUserEmail(recipient.userId);
        return {
          ...recipient,
          email: email || `user-${recipient.userId}@example.com`, // Fallback
        };
      }
      return recipient;
    })
  );
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

    // Enrich recipients with email addresses
    const enrichedRecipients = await enrichRecipientsWithEmails(recipients);

    await sendAppointmentBookedNotification(enrichedRecipients, details);

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

    // Enrich recipients with email addresses
    const enrichedRecipients = await enrichRecipientsWithEmails(recipients);

    await sendAppointmentCancelledNotification(enrichedRecipients, details, cancellationReason);

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

    // Enrich recipients with email addresses
    const enrichedRecipients = await enrichRecipientsWithEmails(recipients);

    await sendAppointmentUpdatedNotification(enrichedRecipients, details, changedFields);

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

    // Enrich recipient with email address if needed
    let enrichedRecipient = recipient;
    if (!recipient.email && recipient.userId) {
      const email = await getUserEmail(recipient.userId);
      enrichedRecipient = {
        ...recipient,
        email: email || `user-${recipient.userId}@example.com`,
      };
    }

    await sendAppointmentReminderNotification(enrichedRecipient, details, hoursUntilAppointment);

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
 * POST /api/notifications/appointment/assigned
 * Send notification when someone is assigned to an appointment
 * Request body:
 * {
 *   recipient: { userId, name, role: "customer" | "technician" },
 *   details: { appointmentId, jobName, technicianName, customerName, ... },
 *   notificationType: "technician_assigned" | "customer_assigned"
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

    // Enrich recipient with email address if needed
    let enrichedRecipient = recipient;
    if (!recipient.email && recipient.userId) {
      const email = await getUserEmail(recipient.userId);
      enrichedRecipient = {
        ...recipient,
        email: email || `user-${recipient.userId}@example.com`,
      };
    }

    // For now, send as updated notification with "assigned" context
    const assignedNotification: NotificationRecipient = enrichedRecipient;
    await sendAppointmentUpdatedNotification([assignedNotification], details, ["assigned"]);

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
 * Send notification when someone is unassigned from an appointment
 * Request body:
 * {
 *   recipient: { userId, name, role: "customer" | "technician" },
 *   details: { appointmentId, jobName, technicianName, customerName, ... },
 *   notificationType: "technician_unassigned" | "customer_unassigned"
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

    // Enrich recipient with email address if needed
    let enrichedRecipient = recipient;
    if (!recipient.email && recipient.userId) {
      const email = await getUserEmail(recipient.userId);
      enrichedRecipient = {
        ...recipient,
        email: email || `user-${recipient.userId}@example.com`,
      };
    }

    // For now, send as updated notification with "unassigned" context
    const unassignedNotification: NotificationRecipient = enrichedRecipient;
    await sendAppointmentUpdatedNotification([unassignedNotification], details, ["unassigned"]);

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
