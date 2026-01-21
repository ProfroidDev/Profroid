import axiosInstance from '../../../shared/api/axiosInstance';
import type { FileCategory } from '../models/FileCategory';
import type { FileOwnerType } from '../models/FileOwnerType';
import type { FileResponseModel } from '../models/FileResponseModel';

export async function uploadFile(
  ownerType: FileOwnerType,
  ownerId: string,
  category: FileCategory,
  file: File
): Promise<FileResponseModel> {
  const form = new FormData();
  form.append('file', file);

  const response = await axiosInstance.post<FileResponseModel>(
    `/files/${ownerType}/${ownerId}/${category}`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
}
