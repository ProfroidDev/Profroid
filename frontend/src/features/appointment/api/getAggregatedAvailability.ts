import axiosInstance from "../../../shared/api/axiosInstance";

export interface BookedSlot {
  startTime: string;
  endTime: string;
}

export interface AggregatedAvailabilityResponse {
  date: string;
  bookedSlots: BookedSlot[];
}

/**
 * Get aggregated available time slots across all technicians for a given date and job.
 * Shows times when at least one technician is available (not booked).
 * Used by customers to see overall availability without selecting a technician first.
 */
export async function getAggregatedAvailability(
  date: string,
  jobName: string
): Promise<AggregatedAvailabilityResponse> {
  const response = await axiosInstance.get(
    `/appointments/availability/aggregated`,
    { params: { date, jobName } }
  );
  
  // The response has bookedSlots array with startTime and endTime
  return response.data;
}
