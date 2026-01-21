import axiosInstance from '../../../shared/api/axiosInstance';
import type { FileResponseModel } from '../models/FileResponseModel';

export async function getFileMetadata(fileId: string): Promise<FileResponseModel> {
  const response = await axiosInstance.get<FileResponseModel>(`/files/${fileId}`);
  return response.data;
}
