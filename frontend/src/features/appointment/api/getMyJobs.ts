import axiosInstance from '../../../shared/api/axiosInstance';
import type { AppointmentResponseModel } from '../models/AppointmentResponseModel';

/**
 * Get all jobs for the current technician
 * Uses JWT token for authentication - no custom headers needed
 */
export async function getMyJobs(): Promise<AppointmentResponseModel[]> {
  const response = await axiosInstance.get<AppointmentResponseModel[]>('/appointments/my-jobs');
  return response.data;
}
