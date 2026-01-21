import axiosInstance from '../../../shared/api/axiosInstance';
import type { CustomerResponseModel } from '../models/CustomerResponseModel';

export async function getCustomer(customerId: string): Promise<CustomerResponseModel> {
  const response = await axiosInstance.get(`/customers/${customerId}`);
  return response.data;
}
