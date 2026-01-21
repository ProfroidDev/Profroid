import axiosInstance from '../../../shared/api/axiosInstance';
import type { AppointmentResponseModel } from '../models/AppointmentResponseModel';
import type { AppointmentStatusChangeRequestModel } from '../models/AppointmentStatusChangeRequestModel';

export async function patchAppointmentStatus(
  appointmentId: string,
  request: AppointmentStatusChangeRequestModel
): Promise<AppointmentResponseModel> {
  const response = await axiosInstance.patch<AppointmentResponseModel>(
    `/appointments/${appointmentId}/status`,
    request
  );

  return response.data;
}
