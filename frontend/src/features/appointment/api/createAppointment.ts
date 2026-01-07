import axiosInstance from "../../../shared/api/axiosInstance";
import type { AppointmentRequestModel } from "../models/AppointmentRequestModel";
import type { AppointmentResponseModel } from "../models/AppointmentResponseModel";

/**
 * Create a new appointment
 * Uses JWT token for authentication - no custom headers needed
 */
export async function createAppointment(
  request: AppointmentRequestModel
): Promise<AppointmentResponseModel> {
  // Defensive normalization: ensure appointmentDate time matches appointmentStartTime if provided
  try {
    if (typeof request.appointmentDate === "string" && request.appointmentStartTime) {
      const day = request.appointmentDate.split("T")[0];
      // Expect HH:mm:ss; fallback to HH:mm
      const start = request.appointmentStartTime.length === 8
        ? request.appointmentStartTime
        : `${request.appointmentStartTime}:00`;
      request.appointmentDate = `${day}T${start}`;
    }
  } catch { void 0; }

  const response = await axiosInstance.post<AppointmentResponseModel>(
    "/appointments",
    request
  );

  return response.data;
}
