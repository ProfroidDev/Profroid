import type { AppointmentAddress } from './AppointmentAddress';

export interface AppointmentRequestModel {
  /** Optional when a technician books on behalf of a customer */
  customerId?: string;
  /** Optional: technician's unique ID (preferred over name-based lookup to avoid same-name conflicts) */
  technicianId?: string;
  /** Optional for customer bookings (auto-assigned), required for technician bookings */
  technicianFirstName?: string;
  /** Optional for customer bookings (auto-assigned), required for technician bookings */
  technicianLastName?: string;
  jobName: string;
  cellarName: string;
  appointmentDate: string;
  /** Optional: explicit start time (HH:mm:ss) to avoid timezone/default-slot mismatches */
  appointmentStartTime?: string;
  /** Optional: explicit end time (HH:mm:ss) based on job duration */
  appointmentEndTime?: string;
  description: string;
  appointmentAddress: AppointmentAddress;
  /** Optional: status of the appointment (SCHEDULED, CANCELLED, COMPLETED) */
  status?: string;
}
