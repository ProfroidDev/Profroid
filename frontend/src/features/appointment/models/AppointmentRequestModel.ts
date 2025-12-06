import type { AppointmentAddress } from "./AppointmentAddress";

export interface AppointmentRequestModel {
  technicianFirstName: string;
  technicianLastName: string;
  jobName: string;
  cellarName: string;
  appointmentDate: string;
  description: string;
  appointmentAddress: AppointmentAddress;
}
