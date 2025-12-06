import type { AppointmentAddress } from "./AppointmentAddress";

export interface CustomerPhoneNumber {
  type: string;
  number: string;
}

export interface AppointmentResponseModel {
  appointmentId: string;
  
  // Customer Information
  customerFirstName: string;
  customerLastName: string;
  customerPhoneNumbers: CustomerPhoneNumber[];
  
  // Technician Information
  technicianFirstName: string;
  technicianLastName: string;
  technicianRole?: string | { [key: string]: any };
  
  // Job Information
  jobName: string;
  jobType: string;
  hourlyRate: number;
  
  // Cellar Information
  cellarName: string;
  
  // Appointment Details
  appointmentDate: string;
  description: string;
  status: string; // SCHEDULED, COMPLETED, CANCELLED
  
  // Appointment Address
  appointmentAddress: AppointmentAddress;
}
