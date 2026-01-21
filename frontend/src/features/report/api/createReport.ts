import axiosInstance from '../../../shared/api/axiosInstance';
import type { ReportRequestModel } from '../models/ReportRequestModel';
import type { ReportResponseModel } from '../models/ReportResponseModel';

/**
 * Create a new report for a completed appointment
 */
export async function createReport(reportData: ReportRequestModel): Promise<ReportResponseModel> {
  const response = await axiosInstance.post<ReportResponseModel>('/reports', reportData);
  return response.data;
}
