import axiosInstance from '../../../shared/api/axiosInstance';
import type { JobRequestModel } from '../models/JobRequestModel';
import type { JobResponseModel } from '../models/JobResponseModel';

export async function createJob(requestModel: JobRequestModel): Promise<JobResponseModel> {
  const response = await axiosInstance.post('/jobs', requestModel);
  return response.data;
}
