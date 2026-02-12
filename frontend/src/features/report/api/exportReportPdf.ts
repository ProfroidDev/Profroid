import axiosInstance from '../../../shared/api/axiosInstance';

/**
 * Export report as PDF
 * @param reportId - The report ID to download
 * @param language - The language for the PDF ('en' or 'fr')
 */
export async function exportReportPdf(reportId: string, language: string = 'en'): Promise<Blob> {
  const response = await axiosInstance.get(`/reports/${reportId}/pdf`, {
    params: { lang: language },
    responseType: 'arraybuffer',
  });
  return new Blob([response.data], { type: 'application/pdf' });
}
