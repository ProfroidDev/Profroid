import axiosInstance from '../../../shared/api/axiosInstance';
import { handleAPIError } from '../../../shared/api/errorHandler';
import type { EmployeeRequestModel } from '../models/EmployeeRequestModel';
import type { EmployeeResponseModel } from '../models/EmployeeResponseModel';

export async function addEmployee(
  employeeData: EmployeeRequestModel
): Promise<EmployeeResponseModel> {
  try {
    const response = await axiosInstance.post('/employees', employeeData);
    return response.data;
  } catch (error: unknown) {
    throw handleAPIError(error);
  }
}
