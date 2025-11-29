import axiosInstance from '../../../shared/api/axiosInstance';
import type { EmployeeSchedule } from '../models/EmployeeSchedule';

export async function getEmployeeSchedule(employeeId: string): Promise<EmployeeSchedule[]> {
  const response = await axiosInstance.get(`/employees/${employeeId}/schedules`);
  return response.data;
}
