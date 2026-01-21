import axiosInstance from '../../../shared/api/axiosInstance';
import type { EmployeeScheduleRequestModel } from '../models/EmployeeScheduleRequestModel';
import type { EmployeeSchedule } from '../models/EmployeeSchedule';

export interface UpdateEmployeeScheduleRequest {
  employeeId: string;
  scheduleRequests: EmployeeScheduleRequestModel[];
}

export async function updateEmployeeSchedule(
  request: UpdateEmployeeScheduleRequest
): Promise<EmployeeSchedule[]> {
  const { employeeId, scheduleRequests } = request;
  const response = await axiosInstance.put(`/employees/${employeeId}/schedules`, scheduleRequests);
  return response.data;
}
