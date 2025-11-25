import axiosInstance from '../../../shared/api/axiosInstance';
import type { CustomerResponseModel } from "../models/CustomerResponseModel";

export async function getCustomers(): Promise<CustomerResponseModel[]> {
  const response = await axiosInstance.get("/customers");
  return response.data;
};
