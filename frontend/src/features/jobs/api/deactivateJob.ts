import axiosInstance from '../../../shared/api/axiosInstance';
import type { JobResponseModel } from '../models/JobResponseModel';
import { handleAPIError } from '../../../shared/api/errorHandler';

export async function deactivateJob(jobId: string): Promise<JobResponseModel> {
  try {
    const response = await axiosInstance.delete(`/jobs/${jobId}/deactivate`);
    return response.data;
  } catch (error: unknown) {
    throw handleAPIError(error);
  }
}
