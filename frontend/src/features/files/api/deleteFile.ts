import axiosInstance from "../../../shared/api/axiosInstance";

export async function deleteFile(fileId: string): Promise<void> {
  await axiosInstance.delete(`/files/${fileId}`);
}
