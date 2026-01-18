import axiosInstance from "../../../shared/api/axiosInstance";
import type { BillResponseModel } from '../models/BillResponseModel';

/**
 * Get all bills (admin only)
 * Returns all bills in the system
 */
export async function getAllBills(): Promise<BillResponseModel[]> {
  const response = await axiosInstance.get<BillResponseModel[]>("/bills");
  return response.data;
}
