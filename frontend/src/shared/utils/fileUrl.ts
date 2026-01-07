export function fileDownloadUrl(fileId?: string | null): string | undefined {
  if (!fileId) return undefined;
  const base = import.meta.env.VITE_BACKEND_URL;
  if (!base) return undefined;
  return `${base}/files/${fileId}/download`;
}
