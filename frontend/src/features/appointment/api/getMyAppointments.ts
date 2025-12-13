import axiosInstance from "../../../shared/api/axiosInstance";
import type { AppointmentResponseModel } from "../models/AppointmentResponseModel";

/**
 * Get all appointments for the current customer
 * Uses JWT token for authentication - no custom headers needed
 */
export async function getMyAppointments(): Promise<AppointmentResponseModel[]> {
  const response = await axiosInstance.get<AppointmentResponseModel[]>(
    "/appointments/my-appointments"
  );
  return response.data;
}
