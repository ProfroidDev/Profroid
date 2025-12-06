import axiosInstance from "../../../shared/api/axiosInstance";

export async function deleteCustomer(customerId: string): Promise<void> {
  await axiosInstance.delete(`/customers/${customerId}`);
}