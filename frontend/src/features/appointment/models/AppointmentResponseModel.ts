import type { AppointmentAddress } from './AppointmentAddress';

export interface CustomerPhoneNumber {
  type: string;
  number: string;
}

export interface AppointmentResponseModel {
  appointmentId: string;

  // Customer Information
  customerId: string;
  customerFirstName: string;
  customerLastName: string;
  customerPhoneNumbers: CustomerPhoneNumber[];

  // Technician Information
  technicianId: string;
  technicianFirstName: string;
  technicianLastName: string;
  technicianRole?: string | { employeeRoleType?: string; [key: string]: unknown };

  // Job Information
  jobName: string;
  jobNameFr?: string;
  jobType: string;
  hourlyRate: number;

  // Cellar Information
  cellarName: string;

  // Appointment Details
  appointmentDate: string;
  appointmentStartTime?: string;
  appointmentEndTime?: string;
  description: string;
  status: string; // SCHEDULED, COMPLETED, CANCELLED

  // Appointment Address
  appointmentAddress: AppointmentAddress;

  // Track who created this appointment (CUSTOMER or TECHNICIAN)
  createdByRole?: string; // Role of the person who created the appointment
}
