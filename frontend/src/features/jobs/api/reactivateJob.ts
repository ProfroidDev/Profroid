import axiosInstance from '../../../shared/api/axiosInstance';
import { handleAPIError } from '../../../shared/api/errorHandler';
import type { JobResponseModel } from '../models/JobResponseModel';

export async function reactivateJob(jobId: string): Promise<JobResponseModel> {
  try {
    const response = await axiosInstance.patch(`/jobs/${jobId}/reactivate`);
    return response.data;
  } catch (error: unknown) {
    throw handleAPIError(error);
  }
}
