import type { JobType } from './JobType';

export interface JobRequestModel {
  jobName: string;
  jobDescription: string;
  jobNameFr?: string;
  jobDescriptionFr?: string;
  hourlyRate: number;
  estimatedDurationMinutes: number;
  jobType: JobType;
  active: boolean;
}
