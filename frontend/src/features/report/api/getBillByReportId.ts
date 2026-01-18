import axiosInstance from "../../../shared/api/axiosInstance";
import type { BillResponseModel } from '../models/BillResponseModel';

/**
 * Get bill by report ID
 * Customers can only view their own bills, admins can view all
 */
export async function getBillByReportId(reportId: number): Promise<BillResponseModel> {
  const response = await axiosInstance.get<BillResponseModel>(`/bills/report/${reportId}`);
  return response.data;
}
