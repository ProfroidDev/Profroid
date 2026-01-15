import axiosInstance from "../../../shared/api/axiosInstance";
import type { ReportResponseModel } from "../models/ReportResponseModel";

/**
 * Get all reports (admin only)
 * Returns all reports in the system
 */
export async function getAllReports(): Promise<ReportResponseModel[]> {
  const response = await axiosInstance.get<ReportResponseModel[]>("/reports");
  return response.data;
}
