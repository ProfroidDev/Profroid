import axiosInstance from "../../../shared/api/axiosInstance";
import type { AppointmentResponseModel } from "../models/AppointmentResponseModel";

/**
 * Get all appointments for the current customer
 * Uses X-Customer-Id and X-User-Role headers
 */
export async function getMyAppointments(
  customerId: string
): Promise<AppointmentResponseModel[]> {
  const response = await axiosInstance.get<AppointmentResponseModel[]>(
    "/appointments/my-appointments",
    {
      headers: {
        "X-Customer-Id": customerId,
        "X-User-Role": "CUSTOMER"
      }
    }
  );
  return response.data;
}
