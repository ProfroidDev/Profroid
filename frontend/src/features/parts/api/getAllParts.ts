import axiosInstance from '../../../shared/api/axiosInstance';
import type { PartResponseModel } from '../models/PartResponseModel';

export async function getAllParts(): Promise<PartResponseModel[]> {
  const response = await axiosInstance.get('/parts');
  return response.data;
}
