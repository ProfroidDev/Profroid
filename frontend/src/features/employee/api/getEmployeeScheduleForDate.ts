import axiosInstance from '../../../shared/api/axiosInstance';
import type { EmployeeSchedule } from '../models/EmployeeSchedule';

export async function getEmployeeScheduleForDate(
  employeeId: string,
  date: string // Format: YYYY-MM-DD
): Promise<EmployeeSchedule[]> {
  const response = await axiosInstance.get(
    `/employees/${employeeId}/schedules?date=${date}`
  );
  return response.data;
}
