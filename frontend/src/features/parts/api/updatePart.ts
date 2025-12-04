import axiosInstance from "../../../shared/api/axiosInstance";
import type { PartResponseModel } from "../models/PartResponseModel";
import type { PartRequestModel } from "../models/PartRequestModel";

export async function updatePart(
  partId: string,
  requestModel: PartRequestModel
) : Promise<PartResponseModel> {
  const response = await axiosInstance.put(`/parts/${partId}`, requestModel);
  return response.data;
}