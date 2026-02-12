import axiosInstance from '../../../shared/api/axiosInstance';

export async function handlePayment(billId: string, locale?: string): Promise<{ url: string }> {
  const response = await axiosInstance.post<{ url: string }>(`/bills/${billId}/checkout-session`, {
    locale,
  });

  return response.data;
}
