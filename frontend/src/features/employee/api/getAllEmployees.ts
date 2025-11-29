import axiosInstance from '../../../shared/api/axiosInstance';
import type { EmployeeResponseModel } from "../models/EmployeeResponseModel";

export async function getEmployees(): Promise<EmployeeResponseModel[]> {
  const response = await axiosInstance.get("/employees");
  return response.data;
}
