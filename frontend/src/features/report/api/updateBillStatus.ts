import axiosInstance from "../../../shared/api/axiosInstance";
import type { BillResponseModel } from '../models/BillResponseModel';

/**
 * Update bill status (mark as paid or unpaid)
 * Admin only
 */
export async function updateBillStatus(billId: string, status: 'PAID' | 'UNPAID'): Promise<BillResponseModel> {
  const response = await axiosInstance.put<BillResponseModel>(`/bills/${billId}/status?status=${status}`);
  return response.data;
}
