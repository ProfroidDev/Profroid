import axiosInstance from '../../../shared/api/axiosInstance';

/**
 * Download bill as PDF
 * @param billId - The bill ID to download
 */
export const downloadBillPdf = async (billId: string): Promise<Blob> => {
  const response = await axiosInstance.get(`/bills/${billId}/pdf`, {
    responseType: 'blob',
  });
  return response.data;
};
