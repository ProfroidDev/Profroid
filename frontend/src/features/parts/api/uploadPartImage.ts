import axiosInstance from '../../../shared/api/axiosInstance';
import type { PartResponseModel } from '../models/PartResponseModel';

// Uploads/replaces part image using backend's atomic endpoint
export async function uploadPartImage(partId: string, file: File): Promise<PartResponseModel> {
  const form = new FormData();
  form.append('file', file);

  const response = await axiosInstance.put<PartResponseModel>(`/parts/${partId}/image`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}
