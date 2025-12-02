import axiosInstance from '../../../shared/api/axiosInstance';
import type { CellarResponseModel } from '../models/CellarResponseModel';

export async function getCellars(): Promise<CellarResponseModel[]> {
  const response = await axiosInstance.get("/cellars");
  return response.data;
};