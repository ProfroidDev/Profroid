import type { JobType } from "./JobType";

export interface JobResponseModel {
  jobId: string;

  jobName: string;
  jobDescription: string;

  hourlyRate: number;
  estimatedDurationMinutes: number;

  jobType: JobType;
  isActive?: boolean;

  /**
   * Some backends return `active` instead of `isActive`.
   * Support both shapes by making both optional.
   */
  active?: boolean;
}