import axiosInstance from "../../../shared/api/axiosInstance";
import type { PartRequestModel } from "../models/PartRequestModel";
import type { PartResponseModel } from "../models/PartResponseModel";

// Creates a part with image atomically using backend's multipart endpoint
export async function createPartWithImage(
  partData: PartRequestModel,
  file: File
): Promise<PartResponseModel> {
  const form = new FormData();
  form.append("part", new Blob([JSON.stringify(partData)], { type: "application/json" }));
  form.append("file", file);

  const response = await axiosInstance.post<PartResponseModel>("/parts/with-image", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}
