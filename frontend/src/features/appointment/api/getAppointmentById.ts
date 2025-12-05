import axiosInstance from "../../../shared/api/axiosInstance";
import type { AppointmentResponseModel } from "../models/AppointmentResponseModel";

/**
 * Get a single appointment by ID
 * Uses appropriate headers based on user role
 */
export async function getAppointmentById(
  appointmentId: string,
  userId: string,
  userRole: "CUSTOMER" | "TECHNICIAN"
): Promise<AppointmentResponseModel> {
  const headers: Record<string, string> = {
    "X-User-Role": userRole
  };
  
  if (userRole === "CUSTOMER") {
    headers["X-Customer-Id"] = userId;
  } else {
    headers["X-Employee-Id"] = userId;
  }
  
  const response = await axiosInstance.get<AppointmentResponseModel>(
    `/appointments/${appointmentId}`,
    { headers }
  );
  return response.data;
}
