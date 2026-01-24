import axiosInstance from '../../../shared/api/axiosInstance';

/**
 * Delete a review (admin only)
 */
export async function deleteReview(reviewId: string): Promise<void> {
  await axiosInstance.delete(`/reviews/${reviewId}`);
}
