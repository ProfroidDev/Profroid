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
  const response = await axiosInstance.post<AppointmentResponseModel>(
    "/appointments",
    request
  );

  return response.data;
}
