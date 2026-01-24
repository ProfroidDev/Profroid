import axiosInstance from '../../../shared/api/axiosInstance';
import type { ReviewRequestModel, ReviewResponseModel } from '../models/ReviewModels';

/**
 * Submit a new review (public endpoint)
 */
export async function createReview(review: ReviewRequestModel): Promise<ReviewResponseModel> {
  const response = await axiosInstance.post<ReviewResponseModel>('/reviews', review);
  return response.data;
}
