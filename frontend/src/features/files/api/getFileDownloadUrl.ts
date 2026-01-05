export function getFileDownloadUrl(fileId: string): string {
  return `${import.meta.env.VITE_BACKEND_URL}/files/${fileId}/download`;
}
