import axiosInstance from '../../../shared/api/axiosInstance';
import type { ReviewResponseModel, ReviewStatusUpdateModel } from '../models/ReviewModels';

/**
 * Update review status (admin only - approve/reject)
 */
export async function updateReviewStatus(
  reviewId: string,
  statusUpdate: ReviewStatusUpdateModel
): Promise<ReviewResponseModel> {
  const response = await axiosInstance.patch<ReviewResponseModel>(
    `/reviews/${reviewId}/status`,
    statusUpdate
  );
  return response.data;
}
