import axiosInstance from '../../../shared/api/axiosInstance';
import type { CustomerRequestModel } from '../models/CustomerRequestModel';
import type { CustomerResponseModel } from '../models/CustomerResponseModel';

export async function createCustomer(
  requestModel: CustomerRequestModel
): Promise<CustomerResponseModel> {
  const response = await axiosInstance.post('/customers', requestModel);
  return response.data;
}
