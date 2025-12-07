import axiosInstance from "../../../shared/api/axiosInstance";
import type { AppointmentRequestModel } from "../models/AppointmentRequestModel";
import type { AppointmentResponseModel } from "../models/AppointmentResponseModel";

export type CreateAppointmentRole = "CUSTOMER" | "TECHNICIAN";

export interface CreateAppointmentOptions {
  /**
   * Header user identifier. For customers this is the customerId, for technicians this is the employeeId.
   */
  userId: string;
  role: CreateAppointmentRole;
}

export async function createAppointment(
  request: AppointmentRequestModel,
  { userId, role }: CreateAppointmentOptions
): Promise<AppointmentResponseModel> {
  const headers =
    role === "CUSTOMER"
      ? {
          "X-Customer-Id": userId,
          "X-User-Role": "CUSTOMER",
        }
      : {
          "X-Employee-Id": userId,
          "X-User-Role": "TECHNICIAN",
        };

  const response = await axiosInstance.post<AppointmentResponseModel>(
    "/appointments",
    request,
    { headers }
  );

  return response.data;
}
