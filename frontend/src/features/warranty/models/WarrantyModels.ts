export interface WarrantyClaimRequestModel {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress?: string;
  productName: string;
  productSerialNumber?: string;
  purchaseDate: string;
  issueDescription: string;
  preferredContactMethod?: string;
}

export interface WarrantyClaimResponseModel {
  claimId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress?: string;
  productName: string;
  productSerialNumber?: string;
  purchaseDate: string;
  issueDescription: string;
  preferredContactMethod?: string;
  status: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'RESOLVED';
  assignedTo?: string;
  adminNotes?: string;
  resolutionDetails?: string;
  reviewedBy?: string;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  resolvedAt?: string;
}
