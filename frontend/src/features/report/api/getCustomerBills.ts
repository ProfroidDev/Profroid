import axiosInstance from "../../../shared/api/axiosInstance";
import type { BillResponseModel } from '../models/BillResponseModel';

/**
 * Get all bills for a customer
 * Customers can only view their own bills, admins can view all
 */
export async function getCustomerBills(customerId: string): Promise<BillResponseModel[]> {
  const response = await axiosInstance.get<BillResponseModel[]>(`/bills/customer/${customerId}`);
  return response.data;
}
