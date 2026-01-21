import axiosInstance from '../../../shared/api/axiosInstance';
import type { EmployeeResponseModel } from '../models/EmployeeResponseModel';

export async function getEmployee(employeeId: string): Promise<EmployeeResponseModel> {
  const response = await axiosInstance.get(`/employees/${employeeId}`);
  return response.data;
}
