import axiosInstance from '../../../shared/api/axiosInstance';
import type { EmployeeSchedule } from '../../employee/models/EmployeeSchedule';
import type { EmployeeScheduleRequestModel } from '../../employee/models/EmployeeScheduleRequestModel';

export interface AddEmployeeScheduleRequest {
  employeeId: string; // 36-char UUID
  scheduleRequests: EmployeeScheduleRequestModel[];
}

export interface AddEmployeeScheduleResponse {
  schedule: EmployeeSchedule;
}

export async function addEmployeeSchedule(
  req: AddEmployeeScheduleRequest
): Promise<AddEmployeeScheduleResponse> {
  const { employeeId, scheduleRequests } = req;
  const endpoint = `/employees/${employeeId}/schedules`;
  const payload = scheduleRequests; // backend expects list in body
  const { data } = await axiosInstance.post(endpoint, payload);
  return data as AddEmployeeScheduleResponse;
}
