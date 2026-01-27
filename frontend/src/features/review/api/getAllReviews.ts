import axiosInstance from '../../../shared/api/axiosInstance';
import type { ReviewResponseModel } from '../models/ReviewModels';

/**
 * Get all reviews (admin only)
 */
export async function getAllReviews(): Promise<ReviewResponseModel[]> {
  const response = await axiosInstance.get<ReviewResponseModel[]>('/reviews');
  return response.data;
}
