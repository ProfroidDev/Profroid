export interface BillResponseModel {
  billId: string;
  reportId: string;
  reportInternalId: number;
  appointmentId: string;
  appointmentDate: string;
  customerId: string;
  customerFirstName: string;
  customerLastName: string;
  jobName: string;
  amount: number;
  status: 'UNPAID' | 'PAID';
  createdAt: string;
  updatedAt?: string;
  paidAt?: string;
}
