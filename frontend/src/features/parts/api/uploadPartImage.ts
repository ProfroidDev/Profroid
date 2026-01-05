import { uploadFile } from "../../files/api/uploadFile";
import type { FileOwnerType } from "../../files/models/FileOwnerType";
import type { FileCategory } from "../../files/models/FileCategory";
import type { PartResponseModel } from "../models/PartResponseModel";
import { getPartById } from "./getPartById";

// Uploads/replaces part image using shared files API, then fetches latest part data.
export async function uploadPartImage(partId: string, file: File): Promise<PartResponseModel> {
  await uploadFile("PART" as FileOwnerType, partId, "IMAGE" as FileCategory, file);
  return getPartById(partId);
}
