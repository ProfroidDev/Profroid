import axiosInstance from "../../../shared/api/axiosInstance";
import type { AppointmentResponseModel } from "../models/AppointmentResponseModel";

/**
 * Get all appointments (admin/technician view)
 * Note: This may require special permissions
 */
export async function getAllAppointments(
  userId: string,
  role: "CUSTOMER" | "TECHNICIAN"
): Promise<AppointmentResponseModel[]> {
  const headers = role === "CUSTOMER"
    ? {
        "X-Customer-Id": userId,
        "X-User-Role": "CUSTOMER"
      }
    : {
        "X-Employee-Id": userId,
        "X-User-Role": "TECHNICIAN"
      };

  const response = await axiosInstance.get<AppointmentResponseModel[]>(
    "/appointments",
    { headers }
  );
  return response.data;
}
