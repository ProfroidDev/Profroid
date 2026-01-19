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

/**
 * Get bill by report ID
 * Customers can only view their own bills, admins can view all
 */
export async function getBillByReportId(reportId: number): Promise<BillResponseModel> {
  const response = await axiosInstance.get<BillResponseModel>(`/bills/report/${reportId}`);
  return response.data;
}

/**
 * Get bill by appointment ID
 * Customers can only view their own bills, admins can view all
 */
export async function getBillByAppointmentId(appointmentId: string): Promise<BillResponseModel> {
  const response = await axiosInstance.get<BillResponseModel>(`/bills/appointment/${appointmentId}`);
  return response.data;
}

/**
 * Get all bills for a customer
 * Customers can only view their own bills, admins can view all
 */
export async function getCustomerBills(customerId: string): Promise<BillResponseModel[]> {
  const response = await axiosInstance.get<BillResponseModel[]>(`/bills/customer/${customerId}`);
  return response.data;
}

/**
 * Get all bills (admin only)
 * Returns all bills in the system
 */
export async function getAllBills(): Promise<BillResponseModel[]> {
  const response = await axiosInstance.get<BillResponseModel[]>("/bills");
  return response.data;
}

/**
 * Update bill status (mark as paid or unpaid)
 * Admin only
 */
export async function updateBillStatus(billId: string, status: 'PAID' | 'UNPAID'): Promise<BillResponseModel> {
  const response = await axiosInstance.put<BillResponseModel>(`/bills/${billId}/status?status=${status}`);
  return response.data;
}
