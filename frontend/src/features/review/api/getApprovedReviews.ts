import axiosInstance from '../../../shared/api/axiosInstance';
import type { ReviewResponseModel } from '../models/ReviewModels';

/**
 * Get approved reviews for public display on home page
 */
export async function getApprovedReviews(): Promise<ReviewResponseModel[]> {
  const response = await axiosInstance.get<ReviewResponseModel[]>('/reviews/approved');
  return response.data;
}
