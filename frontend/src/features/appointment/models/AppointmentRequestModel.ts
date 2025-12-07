import type { AppointmentAddress } from "./AppointmentAddress";

export interface AppointmentRequestModel {
  /** Optional when a technician books on behalf of a customer */
  customerId?: string;
  technicianFirstName: string;
  technicianLastName: string;
  jobName: string;
  cellarName: string;
  appointmentDate: string;
  description: string;
  appointmentAddress: AppointmentAddress;
}
