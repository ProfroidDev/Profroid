import axiosInstance from '../../../shared/api/axiosInstance';
import type { ReviewResponseModel } from '../models/ReviewModels';

/**
 * Get pending reviews (admin only)
 */
export async function getPendingReviews(): Promise<ReviewResponseModel[]> {
  const response = await axiosInstance.get<ReviewResponseModel[]>('/reviews/pending');
  return response.data;
}
