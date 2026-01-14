import axiosInstance from "../../../shared/api/axiosInstance";
import type { ReportRequestModel } from "../models/ReportRequestModel";
import type { ReportResponseModel } from "../models/ReportResponseModel";

/**
 * Update an existing report
 */
export async function updateReport(
  reportId: string,
  reportData: ReportRequestModel
): Promise<ReportResponseModel> {
  const response = await axiosInstance.put<ReportResponseModel>(
    `/reports/${reportId}`,
    reportData
  );
  return response.data;
}
