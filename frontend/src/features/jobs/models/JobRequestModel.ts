import type { JobType } from "./JobType";

export interface JobRequestModel {
  jobName: string;
  jobDescription: string;
  hourlyRate: number;
  estimatedDurationMinutes: number;
  jobType: JobType;
  active: boolean;
}
