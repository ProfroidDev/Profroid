export type DayOfWeekType = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY';
export type TimeSlotType = 'NINE_AM' | 'ELEVEN_AM' | 'ONE_PM' | 'THREE_PM' | 'FIVE_PM';

export interface EmployeeScheduleRequestModel {
  dayOfWeek: DayOfWeekType;
  timeSlots: TimeSlotType[];
}
