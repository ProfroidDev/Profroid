import axiosInstance from '../../../shared/api/axiosInstance';
import type { CustomerRequestModel } from '../models/CustomerRequestModel';
import type { CustomerResponseModel } from "../models/CustomerResponseModel";

export async function updateCustomer(customerId: string, updatedCustomer: CustomerRequestModel): Promise<CustomerResponseModel> {
  const response = await axiosInstance.put(`/customers/${customerId}`, updatedCustomer);
  return response.data;
};
