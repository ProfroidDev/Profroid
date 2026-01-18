import axiosInstance from "../../../shared/api/axiosInstance";
import type { BillResponseModel } from '../models/BillResponseModel';

/**
 * Get bill by bill ID
 * Customers can only view their own bills, admins can view all
 */
export async function getBillById(billId: string): Promise<BillResponseModel> {
  const response = await axiosInstance.get<BillResponseModel>(`/bills/${billId}`);
  return response.data;
}
