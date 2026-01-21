import axiosInstance from '../../../shared/api/axiosInstance';
import type { JobResponseModel } from '../models/JobResponseModel';

export async function getJobs(): Promise<JobResponseModel[]> {
  const response = await axiosInstance.get('/jobs');
  return response.data;
}
