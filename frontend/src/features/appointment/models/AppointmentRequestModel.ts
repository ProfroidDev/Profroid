import type { AppointmentAddress } from "./AppointmentAddress";

export interface AppointmentRequestModel {
  /** Optional when a technician books on behalf of a customer */
  customerId?: string;
  /** Optional for customer bookings (auto-assigned), required for technician bookings */
  technicianFirstName?: string;
  /** Optional for customer bookings (auto-assigned), required for technician bookings */
  technicianLastName?: string;
  jobName: string;
  cellarName: string;
  appointmentDate: string;
  description: string;
  appointmentAddress: AppointmentAddress;
}
