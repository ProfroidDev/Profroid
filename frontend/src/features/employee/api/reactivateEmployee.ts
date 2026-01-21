import axiosInstance from '../../../shared/api/axiosInstance';
import { handleAPIError } from '../../../shared/api/errorHandler';
import type { EmployeeResponseModel } from '../models/EmployeeResponseModel';

export async function reactivateEmployee(employeeId: string): Promise<EmployeeResponseModel> {
  try {
    const response = await axiosInstance.patch(`/employees/${employeeId}/reactivate`);
    return response.data;
  } catch (error: unknown) {
    throw handleAPIError(error);
  }
}
