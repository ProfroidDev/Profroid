import axiosInstance from "../../../shared/api/axiosInstance";
import type { AppointmentResponseModel } from "../models/AppointmentResponseModel";

/**
 * Get all appointments (admin/technician view)
 * Uses JWT token for authentication - no custom headers needed
 */
export async function getAllAppointments(): Promise<AppointmentResponseModel[]> {
  const response = await axiosInstance.get<AppointmentResponseModel[]>(
    "/appointments"
  );
  return response.data;
}
