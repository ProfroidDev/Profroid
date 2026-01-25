import { Router, Request, Response } from "express";
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
 * POST /api/notifications/appointment/booked
 * Send appointment booked notifications to customer and technician
 * Request body:
 * {
 *   recipients: [{ email, name, role: "customer" | "technician" }],
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

    await sendAppointmentBookedNotification(recipients, details);

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
 *   recipients: [{ email, name, role: "customer" | "technician" }],
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

    await sendAppointmentCancelledNotification(recipients, details, cancellationReason);

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
 *   recipients: [{ email, name, role: "customer" | "technician" }],
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

    await sendAppointmentUpdatedNotification(recipients, details, changedFields);

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
 *   recipient: { email, name, role: "customer" | "technician" },
 *   details: { appointmentId, jobName, technicianName, customerName, ... },
 *   hoursUntilAppointment: number
 * }
 */
router.post("/appointment/reminder", async (req: Request, res: Response) => {
  try {
    const { recipient, details, hoursUntilAppointment } = req.body;

    if (!recipient || !recipient.email || !recipient.name) {
      return res.status(400).json({
        success: false,
        error: "Recipient with email and name is required",
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

    await sendAppointmentReminderNotification(recipient, details, hoursUntilAppointment);

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

export default router;
