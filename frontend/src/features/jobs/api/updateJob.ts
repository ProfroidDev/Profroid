import axiosInstance from '../../../shared/api/axiosInstance';
import type { JobRequestModel } from '../models/JobRequestModel';
import type { JobResponseModel } from '../models/JobResponseModel';

export async function updateJob(
  jobId: string,
  requestModel: JobRequestModel
): Promise<JobResponseModel> {
  const response = await axiosInstance.put<JobResponseModel>(`jobs/${jobId}`, requestModel);
  return response.data;
}
