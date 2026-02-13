import axiosInstance from '../../../shared/api/axiosInstance';
import type { WarrantyClaimResponseModel } from '../models/WarrantyModels';

/**
 * Get all warranty claims (admin only)
 */
export async function getAllWarrantyClaims(): Promise<WarrantyClaimResponseModel[]> {
  const response = await axiosInstance.get<WarrantyClaimResponseModel[]>('/warranty-claims');
  return response.data;
}

/**
 * Get warranty claims by status (admin only)
 */
export async function getWarrantyClaimsByStatus(status: string): Promise<WarrantyClaimResponseModel[]> {
  const response = await axiosInstance.get<WarrantyClaimResponseModel[]>(`/warranty-claims/status/${status}`);
  return response.data;
}

/**
 * Update warranty claim status (admin only)
 */
export async function updateWarrantyClaimStatus(
  claimId: string,
  data: { status: string; adminNotes?: string; resolutionDetails?: string }
): Promise<WarrantyClaimResponseModel> {
  const response = await axiosInstance.patch<WarrantyClaimResponseModel>(
    `/warranty-claims/${claimId}/status`,
    data
  );
  return response.data;
}
