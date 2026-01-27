export interface ReviewRequestModel {
  rating: number;
  comment?: string;
  customerName: string;
  customerId?: string;
}

export interface ReviewResponseModel {
  reviewId: string;
  rating: number;
  comment?: string;
  customerName: string;
  customerId?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy?: string;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
}

export interface ReviewStatusUpdateModel {
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy?: string;
}
