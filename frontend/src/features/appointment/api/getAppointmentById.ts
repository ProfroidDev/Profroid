import axiosInstance from '../../../shared/api/axiosInstance';
import type { AppointmentResponseModel } from '../models/AppointmentResponseModel';

/**
 * Get a single appointment by ID
 * Uses JWT token for authentication - no custom headers needed
 */
export async function getAppointmentById(appointmentId: string): Promise<AppointmentResponseModel> {
  const response = await axiosInstance.get<AppointmentResponseModel>(
    `/appointments/${appointmentId}`
  );
  return response.data;
}
