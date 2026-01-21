import axiosInstance from '../../../shared/api/axiosInstance';
import type { BillResponseModel } from '../models/BillResponseModel';

/**
 * Get bill by appointment ID
 * Customers can only view their own bills, admins can view all
 */
export async function getBillByAppointmentId(appointmentId: string): Promise<BillResponseModel> {
  const response = await axiosInstance.get<BillResponseModel>(
    `/bills/appointment/${appointmentId}`
  );
  return response.data;
}
