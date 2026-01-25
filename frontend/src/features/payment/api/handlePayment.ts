import axiosInstance from '../../../shared/api/axiosInstance';

export async function handlePayment(billId: string): Promise<{ url: string }> {
  const response = await axiosInstance.post<{ url: string }>(
    `/bills/${billId}/checkout-session`
  );

  return response.data;
}
