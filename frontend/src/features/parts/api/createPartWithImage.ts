import { uploadFile } from "../../files/api/uploadFile";
import type { FileOwnerType } from "../../files/models/FileOwnerType";
import type { FileCategory } from "../../files/models/FileCategory";
import axiosInstance from "../../../shared/api/axiosInstance";
import type { PartRequestModel } from "../models/PartRequestModel";
import type { PartResponseModel } from "../models/PartResponseModel";

// Creates a part, then uploads its image via the shared files feature.
export async function createPartWithImage(
  partData: PartRequestModel,
  file: File
): Promise<PartResponseModel> {
  // First create the part (JSON)
  const partResponse = await axiosInstance.post<PartResponseModel>("/parts", partData);
  const created = partResponse.data;

  // Then upload the image tied to the part
  await uploadFile("PART" as FileOwnerType, created.partId, "IMAGE" as FileCategory, file);

  // Return the part (backend imageFileId will be present on next fetch)
  return created;
}
