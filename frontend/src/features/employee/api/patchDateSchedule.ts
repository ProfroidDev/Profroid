import axiosInstance from '../../../shared/api/axiosInstance';
import type { EmployeeScheduleRequestModel } from '../models/EmployeeScheduleRequestModel';
import type { EmployeeSchedule } from '../models/EmployeeSchedule';

export interface PatchDateScheduleRequest {
  employeeId: string;
  date: string; // Format: YYYY-MM-DD
  scheduleRequest: EmployeeScheduleRequestModel;
}

export async function patchDateSchedule(
  request: PatchDateScheduleRequest
): Promise<EmployeeSchedule> {
  const { employeeId, date, scheduleRequest } = request;
  const response = await axiosInstance.patch(
    `/employees/${employeeId}/schedules/${date}`,
    scheduleRequest
  );
  return response.data;
}
