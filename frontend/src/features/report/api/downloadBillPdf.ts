import axiosInstance from '../../../shared/api/axiosInstance';

/**
 * Download bill as PDF
 * @param billId - The bill ID to download
 * @param language - The language for the PDF ('en' or 'fr')
 */
export const downloadBillPdf = async (billId: string, language: string = 'en'): Promise<Blob> => {
  const response = await axiosInstance.get(`/bills/${billId}/pdf`, {
    params: { lang: language },
    responseType: 'blob',
  });
  return response.data;
};
