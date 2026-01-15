export interface ReportResponseModel {
  reportId: string;
  appointmentId: string;
  appointmentDate: string;
  appointmentStatus: string; // SCHEDULED, COMPLETED, CANCELLED
  
  // Customer info
  customerId: string;
  customerFirstName: string;
  customerLastName: string;
  customerPhone: string | null;
  
  // Technician info
  technicianId: string;
  technicianFirstName: string;
  technicianLastName: string;
  
  // Job info
  jobName: string;
  hourlyRate: number;
  
  // Work details
  hoursWorked: number;
  frais: number;
  fraisDeplacement: number;
  
  // Parts
  parts: ReportPartResponseModel[];
  
  // Calculated amounts
  laborCost: number;
  partsCost: number;
  subtotal: number;
  tpsAmount: number;
  tvqAmount: number;
  total: number;
  
  // Timestamps
  createdAt: string;
  updatedAt: string | null;
}

export interface ReportPartResponseModel {
  partId: string;
  partName: string;
  quantity: number;
  price: number;
  totalPrice: number;
  notes?: string | null;
}
