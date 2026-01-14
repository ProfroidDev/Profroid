import axiosInstance from "../../../shared/api/axiosInstance";
import type { ReportResponseModel } from "../models/ReportResponseModel";

/**
 * Get report by appointment ID
 */
export async function getReportByAppointmentId(
  appointmentId: string
): Promise<ReportResponseModel | null> {
  try {
    const response = await axiosInstance.get<ReportResponseModel>(
      `/reports/appointment/${appointmentId}`
    );
    return response.data;
  } catch (error: unknown) {
    // If 404, no report exists yet
    if (typeof error === "object" && error && "response" in error) {
      const axiosError = error as { response?: { status: number } };
      if (axiosError.response?.status === 404) {
        return null;
      }
    }
    throw error;
  }
}
