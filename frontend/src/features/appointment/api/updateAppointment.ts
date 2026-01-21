import axiosInstance from '../../../shared/api/axiosInstance';
import type { AppointmentRequestModel } from '../models/AppointmentRequestModel';
import type { AppointmentResponseModel } from '../models/AppointmentResponseModel';

export async function updateAppointment(
  appointmentId: string,
  request: AppointmentRequestModel
): Promise<AppointmentResponseModel> {
  const response = await axiosInstance.put<AppointmentResponseModel>(
    `/appointments/${appointmentId}`,
    request
  );

  return response.data;
}
