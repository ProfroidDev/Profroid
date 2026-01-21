import type { JobType } from './JobType';

export interface JobResponseModel {
  jobId: string;

  jobName: string;
  jobDescription: string;

  hourlyRate: number;
  estimatedDurationMinutes: number;

  jobType: JobType;
  active: boolean;

  imageFileId?: string;
}
