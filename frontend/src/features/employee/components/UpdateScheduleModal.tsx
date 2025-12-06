import { useState, useEffect } from 'react';
import './AddScheduleModal.css'; // Reuse same styles
import { updateEmployeeSchedule } from '../../employee/api/updateEmployeeSchedule';
import type { UpdateEmployeeScheduleRequest } from '../../employee/api/updateEmployeeSchedule';
import type { DayOfWeekType, TimeSlotType } from '../../employee/models/EmployeeScheduleRequestModel';
import type { EmployeeSchedule } from '../../employee/models/EmployeeSchedule';

type Props = {
  employeeId: string;
  isTechnician: boolean;
  existingSchedule: EmployeeSchedule[]; // Pre-populate from this
  onClose: () => void;
  onUpdated: () => void;
  onError?: (message: string) => void; // Optional error callback for parent to show toast
};

type NonTechSlot = { start: string; end: string };
type TechSlot = TimeSlotType;

const DAYS: DayOfWeekType[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
const AVAILABLE_SLOTS: TimeSlotType[] = ['NINE_AM', 'ELEVEN_AM', 'ONE_PM', 'THREE_PM', 'FIVE_PM'];

const SLOT_LABELS: Record<TimeSlotType, string> = {
  NINE_AM: '9:00 AM',
  ELEVEN_AM: '11:00 AM',
  ONE_PM: '1:00 PM',
  THREE_PM: '3:00 PM',
  FIVE_PM: '5:00 PM',
};

function toTimeSlotEnum(time: string): TimeSlotType | null {
  switch (time) {
    case '09:00': return 'NINE_AM';
    case '11:00': return 'ELEVEN_AM';
    case '13:00': return 'ONE_PM';
    case '15:00': return 'THREE_PM';
    case '17:00': return 'FIVE_PM';
    default: return null;
  }
}

function toTimeString(slot: TimeSlotType): string {
  switch (slot) {
    case 'NINE_AM': return '09:00';
    case 'ELEVEN_AM': return '11:00';
    case 'ONE_PM': return '13:00';
    case 'THREE_PM': return '15:00';
    case 'FIVE_PM': return '17:00';
  }
}

function parseDisplayTimeToEnum(displayTime: string): TimeSlotType | null {
  // Convert display strings like "9:00 AM" to enum
  const normalized = displayTime.trim().toUpperCase();
  if (normalized.includes('9:00') || normalized.includes('9 AM')) return 'NINE_AM';
  if (normalized.includes('11:00') || normalized.includes('11 AM')) return 'ELEVEN_AM';
  if (normalized.includes('1:00 PM') || normalized.includes('1 PM')) return 'ONE_PM';
  if (normalized.includes('3:00 PM') || normalized.includes('3 PM')) return 'THREE_PM';
  if (normalized.includes('5:00 PM') || normalized.includes('5 PM')) return 'FIVE_PM';
  return null;
}

function parseTime(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function toMinutes(slot: TimeSlotType): number {
  switch (slot) {
    case 'NINE_AM': return 9 * 60;
    case 'ELEVEN_AM': return 11 * 60;
    case 'ONE_PM': return 13 * 60;
    case 'THREE_PM': return 15 * 60;
    case 'FIVE_PM': return 17 * 60;
  }
}

export default function UpdateScheduleModal({ employeeId, isTechnician, existingSchedule, onClose, onUpdated, onError }: Props) {
  const [submitting, setSubmitting] = useState(false);
  
  const [nonTechSlots, setNonTechSlots] = useState<Record<DayOfWeekType, NonTechSlot>>(() => ({
    MONDAY: { start: '09:00', end: '' },
    TUESDAY: { start: '09:00', end: '' },
    WEDNESDAY: { start: '09:00', end: '' },
    THURSDAY: { start: '09:00', end: '' },
    FRIDAY: { start: '09:00', end: '' },
  }));
  
  const [techSlots, setTechSlots] = useState<Record<DayOfWeekType, TechSlot[]>>(() => ({
    MONDAY: [],
    TUESDAY: [],
    WEDNESDAY: [],
    THURSDAY: [],
    FRIDAY: [],
  }));

  // Pre-populate from existing schedule
  useEffect(() => {
    if (!existingSchedule || existingSchedule.length === 0) return;

    if (!isTechnician) {
      // Non-tech: group by day, extract start/end
      const grouped: Record<string, string[]> = {};
      existingSchedule.forEach(sch => {
        const day = sch.dayOfWeek.toUpperCase();
        if (!grouped[day]) grouped[day] = [];
        grouped[day].push(...sch.timeSlots);
      });

      setNonTechSlots(prev => {
        const newNonTech = { ...prev };
        DAYS.forEach(day => {
          if (grouped[day] && grouped[day].length >= 2) {
            // Convert display strings to enums, then sort
            const slots = grouped[day]
              .map(s => parseDisplayTimeToEnum(s))
              .filter((s): s is TimeSlotType => s !== null)
              .sort((a, b) => toMinutes(a) - toMinutes(b));
            
            if (slots.length >= 2) {
              newNonTech[day] = {
                start: toTimeString(slots[0]),
                end: toTimeString(slots[1])
              };
            }
          }
        });
        return newNonTech;
      });
    } else {
      // Tech: group by day, collect all slots
      const grouped: Record<string, TimeSlotType[]> = {};
      existingSchedule.forEach(sch => {
        const day = sch.dayOfWeek.toUpperCase();
        if (!grouped[day]) grouped[day] = [];
        // Convert display strings to enums
        const enumSlots = sch.timeSlots
          .map(s => parseDisplayTimeToEnum(s))
          .filter((s): s is TimeSlotType => s !== null);
        grouped[day].push(...enumSlots);
      });

      setTechSlots(prev => {
        const newTech = { ...prev };
        DAYS.forEach(day => {
          if (grouped[day]) {
            newTech[day] = grouped[day];
          }
        });
        return newTech;
      });
    }
  }, [existingSchedule, isTechnician]);

  function updateNonTechSlot(day: DayOfWeekType, field: 'start' | 'end', value: string) {
    setNonTechSlots(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  }

  function addTechSlot(day: DayOfWeekType, slot: TechSlot) {
    setTechSlots(prev => ({ ...prev, [day]: [...prev[day], slot] }));
  }

  function removeTechSlot(day: DayOfWeekType, idx: number) {
    setTechSlots(prev => ({ ...prev, [day]: prev[day].filter((_, i) => i !== idx) }));
  }

  function validate(): string | null {
    let weeklyHours = 0;

    for (const day of DAYS) {
      if (!isTechnician) {
        const slot = nonTechSlots[day];
        if (!slot.start || !slot.end) return `Day ${day}: start and end times are required.`;
        if (slot.start !== '09:00') return 'Non-technicians must start at NINE_AM (09:00).';
        const startMinutes = parseTime(slot.start);
        const endMinutes = parseTime(slot.end);
        if (startMinutes >= endMinutes) return `Day ${day}: start must be before end.`;
        const dailyHours = (endMinutes - startMinutes) / 60;
        if (dailyHours > 8) return `Non-technicians cannot work more than 8 hours per day. Day: ${day}, Hours: ${dailyHours}`;
        weeklyHours += dailyHours;
      } else {
        const slots = techSlots[day];
        if (!slots || slots.length === 0) {
          return `Day ${day} must have at least one time slot.`;
        }
        const minutesStarts = slots.map(toMinutes).sort((a,b)=>a-b);
        for (let i=1;i<minutesStarts.length;i++) {
          if (minutesStarts[i] - minutesStarts[i-1] < 120) return 'Technician time slots must be at least 2 hours apart.';
        }
        if (slots.length > 4) return `Technician cannot exceed 8 hours in a single day (max 4 slots of 2h each). Day: ${day}`;
        weeklyHours += slots.length * 2;
      }
    }

    if (weeklyHours > 40) return `Employee cannot exceed 40 hours in a 5-day week. Requested: ${weeklyHours} hours.`;
    return null;
  }

  async function submit() {
    const err = validate();
    if (err) {
      alert(err);
      return;
    }

    const weeklyRequests = DAYS.map(day => {
      if (!isTechnician) {
        const slot = nonTechSlots[day];
        const startEnum = toTimeSlotEnum(slot.start);
        const endEnum = toTimeSlotEnum(slot.end);
        const list: TimeSlotType[] = [];
        if (startEnum) list.push(startEnum);
        if (endEnum) list.push(endEnum);
        list.sort((a, b) => toMinutes(a) - toMinutes(b));
        return { dayOfWeek: day, timeSlots: list };
      } else {
        const sortedSlots = [...techSlots[day]].sort((a, b) => toMinutes(a) - toMinutes(b));
        return { dayOfWeek: day, timeSlots: sortedSlots };
      }
    });

    const payload: UpdateEmployeeScheduleRequest = {
      employeeId,
      scheduleRequests: weeklyRequests,
    };

    try {
      setSubmitting(true);
      await updateEmployeeSchedule(payload);
      onUpdated();
      onClose();
    } catch (e: unknown) {
      let message = 'Failed to update schedule';
      
      // Log full error for debugging
      console.error('Schedule update error:', e);
      
      if (typeof e === 'object' && e && 'response' in e) {
        const resp = (e as { response?: { data?: unknown } }).response;
        console.log('Response data:', resp?.data);
        
        // Backend returns plain string or JSON object
        if (resp?.data) {
          if (typeof resp.data === 'string') {
            // Plain string response (from GlobalControllerExceptionHandler)
            message = resp.data;
          } else if (typeof resp.data === 'object') {
            // JSON object response
            const data = resp.data as Record<string, unknown>;
            message = (data.message as string) || 
                     (data.error as string) || 
                     (data.details as string) ||
                     message;
          }
        }
      }
      
      // Use toast callback if provided, otherwise fallback to alert
      if (onError) {
        onError(message);
      } else {
        alert(message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="add-schedule-modal-backdrop">
      <div className="add-schedule-modal">
        <div className="header">
          <h2>Update Weekly Schedule</h2>
          <button className="close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="content">
          {DAYS.map(day => (
            <div key={day} className="day-block">
              <div className="day-header">
                <span>{day.charAt(0) + day.slice(1).toLowerCase()}</span>
              </div>
              
              {!isTechnician ? (
                <div className="slot">
                  <label>
                    <span>Start</span>
                    <input
                      type="time"
                      value={nonTechSlots[day].start}
                      onChange={e => updateNonTechSlot(day, 'start', e.target.value)}
                      disabled
                    />
                  </label>
                  <label>
                    <span>End (hour only)</span>
                    <select
                      value={nonTechSlots[day].end}
                      onChange={e => updateNonTechSlot(day, 'end', e.target.value)}
                      className="hour-select"
                    >
                      <option value="">Select hour</option>
                      <option value="11:00">11:00 AM</option>
                      <option value="13:00">1:00 PM</option>
                      <option value="15:00">3:00 PM</option>
                      <option value="17:00">5:00 PM</option>
                    </select>
                  </label>
                </div>
              ) : (
                <>
                  {[...techSlots[day]]
                    .sort((a, b) => toMinutes(a) - toMinutes(b))
                    .map((slot, idx) => {
                      const originalIdx = techSlots[day].indexOf(slot);
                      return (
                        <div className="slot" key={`${day}-${slot}-${idx}`}>
                          <span className="slot-label">{SLOT_LABELS[slot]}</span>
                          <button className="remove" onClick={() => removeTechSlot(day, originalIdx)} type="button">Remove</button>
                        </div>
                      );
                    })}
                  <div className="slot-add-controls">
                    {AVAILABLE_SLOTS.filter(slotType => !techSlots[day].includes(slotType)).map(slotType => (
                      <button
                        key={slotType}
                        className="btn-slot-option"
                        onClick={() => addTechSlot(day, slotType)}
                        type="button"
                      >
                        {SLOT_LABELS[slotType]}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        <div className="footer">
          <button className="secondary" onClick={onClose} disabled={submitting}>Cancel</button>
          <button className="primary" onClick={submit} disabled={submitting}>Update Schedule</button>
        </div>
      </div>
    </div>
  );
}
