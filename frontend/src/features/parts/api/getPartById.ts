import axiosInstance from "../../../shared/api/axiosInstance";
import type { PartResponseModel } from "../models/PartResponseModel";

export async function getPartById(partId: string): Promise<PartResponseModel> {
  const response = await axiosInstance.get(`/parts/${partId}`);
  return response.data;
}