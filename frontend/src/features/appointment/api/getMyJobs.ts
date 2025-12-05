import axiosInstance from "../../../shared/api/axiosInstance";
import type { AppointmentResponseModel } from "../models/AppointmentResponseModel";

/**
 * Get all jobs for the current technician
 * Uses X-Employee-Id and X-User-Role headers
 */
export async function getMyJobs(
  technicianId: string
): Promise<AppointmentResponseModel[]> {
  const response = await axiosInstance.get<AppointmentResponseModel[]>(
    "/appointments/my-jobs",
    {
      headers: {
        "X-Employee-Id": technicianId,
        "X-User-Role": "TECHNICIAN"
      }
    }
  );
  return response.data;
}
