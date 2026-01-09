import axiosInstance from "../../../shared/api/axiosInstance";

export interface BookedSlot {
  startTime: string;
  endTime: string;
}

export interface TechnicianBookedSlotsResponse {
  technicianId: string;
  date: string;
  bookedSlots: BookedSlot[];
}

/**
 * Get booked time slots for a technician on a specific date.
 * Used to check technician availability when booking appointments.
 */
export async function getTechnicianBookedSlots(
  technicianId: string,
  date: string,
  appointmentId?: string
): Promise<TechnicianBookedSlotsResponse> {
  const response = await axiosInstance.get(
    `/appointments/technician/${technicianId}/booked-slots`,
    { params: { date, appointmentId } }
  );
  return response.data;
}
