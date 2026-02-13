import axiosInstance from '../../../shared/api/axiosInstance';
import type {
  WarrantyClaimRequestModel,
  WarrantyClaimResponseModel,
} from '../models/WarrantyModels';

/**
 * Submit a new warranty claim (public endpoint)
 */
export async function createWarrantyClaim(
  claim: WarrantyClaimRequestModel
): Promise<WarrantyClaimResponseModel> {
  const response = await axiosInstance.post<WarrantyClaimResponseModel>('/warranty-claims', claim);
  return response.data;
}
