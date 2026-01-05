import axiosInstance from "../../../shared/api/axiosInstance";
import type { FileCategory } from "../models/FileCategory";
import type { FileOwnerType } from "../models/FileOwnerType";
import type { FileResponseModel } from "../models/FileResponseModel";

export async function listFiles(
  ownerType: FileOwnerType,
  ownerId: string,
  category?: FileCategory
): Promise<FileResponseModel[]> {
  const params: Record<string, string> = { ownerType, ownerId };
  if (category) {
    params.category = category;
  }

  const response = await axiosInstance.get<FileResponseModel[]>("/files", { params });
  return response.data;
}
