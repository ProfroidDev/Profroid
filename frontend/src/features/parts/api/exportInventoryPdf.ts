import axiosInstance from '../../../shared/api/axiosInstance';

export async function exportInventoryPdf(): Promise<Blob> {
  const response = await axiosInstance.get('/parts/export/pdf', {
    responseType: 'arraybuffer',
  });
  return new Blob([response.data], { type: 'application/pdf' });
}
