import axiosInstance from "../../../shared/api/axiosInstance";
import type { JobResponseModel } from "../models/JobResponseModel";

export async function uploadJobImage(jobId: string, file: File): Promise<JobResponseModel> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await axiosInstance.put<JobResponseModel>(`jobs/${jobId}/image`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}
