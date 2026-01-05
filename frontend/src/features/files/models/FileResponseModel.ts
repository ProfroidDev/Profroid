export interface FileResponseModel {
  fileId: string;
  ownerType: string;
  ownerId: string;
  category: string;
  originalFilename: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
}
