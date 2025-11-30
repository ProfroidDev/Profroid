import axiosInstance from "../../../shared/api/axiosInstance";

export async function deleteJob(jobId: string): Promise<void> {
  await axiosInstance.delete(`/jobs/${jobId}`);
}

