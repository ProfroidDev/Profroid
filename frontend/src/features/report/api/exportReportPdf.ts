import axiosInstance from "../../../shared/api/axiosInstance";

export async function exportReportPdf(reportId: string): Promise<Blob> {
  const response = await axiosInstance.get(`/reports/${reportId}/pdf`, {
    responseType: 'arraybuffer',
  });
  return new Blob([response.data], { type: "application/pdf" });
}
