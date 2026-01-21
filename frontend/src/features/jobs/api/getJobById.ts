import axiosInstance from '../../../shared/api/axiosInstance';
import type { JobResponseModel } from '../models/JobResponseModel';

export async function getJobById(jobId: string): Promise<JobResponseModel> {
  const response = await axiosInstance.get(`/jobs/${jobId}`);
  return response.data;
}
