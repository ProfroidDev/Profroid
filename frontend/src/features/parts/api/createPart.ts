import axiosInstance from "../../../shared/api/axiosInstance";
import type { PartRequestModel } from "../models/PartRequestModel";
import type { PartResponseModel } from "../models/PartResponseModel";

export async function createPart(
  partData: PartRequestModel
): Promise<PartResponseModel> {
  const response = await axiosInstance.post<PartResponseModel>(
    "/parts",
    partData
  );
  return response.data;
}