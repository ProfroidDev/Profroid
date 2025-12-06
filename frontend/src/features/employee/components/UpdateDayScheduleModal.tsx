import { useState, useEffect } from 'react';
import './AddScheduleModal.css'; // Reuse same styles
import { patchDateSchedule } from '../../employee/api/patchDateSchedule';
import type { PatchDateScheduleRequest } from '../../employee/api/patchDateSchedule';
import type { DayOfWeekType, TimeSlotType } from '../../employee/models/EmployeeScheduleRequestModel';
import type { EmployeeSchedule } from '../../employee/models/EmployeeSchedule';

type Props = {
  employeeId: string;
  isTechnician: boolean;
  selectedDate: Date;
  currentSchedule: EmployeeSchedule | null; // Current schedule for this day
  onClose: () => void;
  onUpdated: () => void;
  onError?: (message: string) => void;
};

type NonTechSlot = { start: string; end: string };
type TechSlot = TimeSlotType;

const AVAILABLE_SLOTS: TimeSlotType[] = ['NINE_AM', 'ELEVEN_AM', 'ONE_PM', 'THREE_PM', 'FIVE_PM'];

const SLOT_LABELS: Record<TimeSlotType, string> = {
  NINE_AM: '9:00 AM',
  ELEVEN_AM: '11:00 AM',
  ONE_PM: '1:00 PM',
  THREE_PM: '3:00 PM',
  FIVE_PM: '5:00 PM',
};

// Helper to convert display time to TimeSlotType enum
function toTimeSlotEnum(displayTime: string): TimeSlotType | null {
  const entry = Object.entries(SLOT_LABELS).find(([, label]) => label === displayTime);
  return entry ? (entry[0] as TimeSlotType) : null;
}

// Helper to convert time string (HH:mm) to TimeSlotType
function timeStringToEnum(time: string): TimeSlotType | null {
  switch (time) {
    case '09:00': return 'NINE_AM';
    case '11:00': return 'ELEVEN_AM';
    case '13:00': return 'ONE_PM';
    case '15:00': return 'THREE_PM';
    case '17:00': return 'FIVE_PM';
    default: return null;
  }
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

export default function UpdateDayScheduleModal({ 
  employeeId, 
  isTechnician, 
  selectedDate, 
  currentSchedule,
  onClose, 
  onUpdated, 
  onError 
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  
  const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase() as DayOfWeekType;
  const formattedDate = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD
  
  const [nonTechSlot, setNonTechSlot] = useState<NonTechSlot>({ start: '09:00', end: '' });
  const [techSlots, setTechSlots] = useState<TechSlot[]>([]);

  // Pre-populate with existing schedule
  useEffect(() => {
    if (!currentSchedule || !currentSchedule.timeSlots || currentSchedule.timeSlots.length === 0) {
      return;
    }

    if (!isTechnician) {
      // Non-tech: extract start and end times
      const enumSlots = currentSchedule.timeSlots
        .map(toTimeSlotEnum)
        .filter((s): s is TimeSlotType => s !== null)
        .sort((a, b) => toMinutes(a) - toMinutes(b));

      if (enumSlots.length >= 2) {
        setNonTechSlot({
          start: '09:00',
          end: SLOT_LABELS[enumSlots[1]].includes('11') ? '11:00' :
               SLOT_LABELS[enumSlots[1]].includes('1') ? '13:00' :
               SLOT_LABELS[enumSlots[1]].includes('3') ? '15:00' : '17:00'
        });
      }
    } else {
      // Technician: extract all slots
      const enumSlots = currentSchedule.timeSlots
        .map(toTimeSlotEnum)
        .filter((s): s is TimeSlotType => s !== null);
      setTechSlots(enumSlots);
    }
  }, [currentSchedule, isTechnician]);

  function updateNonTechSlot(field: 'start' | 'end', value: string) {
    setNonTechSlot(prev => ({ ...prev, [field]: value }));
  }

  function addTechSlot(slot: TechSlot) {
    setTechSlots(prev => [...prev, slot]);
  }

  function removeTechSlot(idx: number) {
    const newSlots = techSlots.filter((_, i) => i !== idx);
    setTechSlots(newSlots);
  }

  function validate(): string | null {
    if (!isTechnician) {
      if (!nonTechSlot.end) {
        return 'Please select an end time for this day.';
      }
      const start = timeStringToEnum(nonTechSlot.start);
      const end = timeStringToEnum(nonTechSlot.end);
      if (!start || !end) {
        return 'Invalid time selection.';
      }
      if (toMinutes(end) <= toMinutes(start)) {
        return 'End time must be after start time.';
      }
      const dailyHours = (toMinutes(end) - toMinutes(start)) / 60;
      if (dailyHours > 8) {
        return 'Non-technician employees cannot work more than 8 hours per day.';
      }
    } else {
      if (techSlots.length === 0) {
        return 'Please add at least one time slot.';
      }
      if (techSlots.length > 4) {
        return 'Technician cannot exceed 8 hours in a single day (max 4 slots of 2h each).';
      }
      const sortedMinutes = techSlots.map(toMinutes).sort((a, b) => a - b);
      for (let i = 1; i < sortedMinutes.length; i++) {
        if (sortedMinutes[i] - sortedMinutes[i - 1] < 120) {
          return 'Technician time slots must be at least 2 hours apart.';
        }
      }
    }
    return null;
  }

  async function submit() {
    const err = validate();
    if (err) {
      if (onError) {
        onError(err);
      }
      return;
    }

    let timeSlots: TimeSlotType[];
    if (!isTechnician) {
      const startEnum = timeStringToEnum(nonTechSlot.start);
      const endEnum = timeStringToEnum(nonTechSlot.end);
      timeSlots = [startEnum!, endEnum!].sort((a, b) => toMinutes(a) - toMinutes(b));
    } else {
      timeSlots = [...techSlots].sort((a, b) => toMinutes(a) - toMinutes(b));
    }

    const payload: PatchDateScheduleRequest = {
      employeeId,
      date: formattedDate,
      scheduleRequest: {
        dayOfWeek,
        timeSlots,
      },
    };

    try {
      setSubmitting(true);
      await patchDateSchedule(payload);
      onUpdated();
      onClose();
    } catch (e: unknown) {
      let message = 'Failed to update schedule for this day';
      
      console.error('Day schedule update error:', e);
      
      if (typeof e === 'object' && e && 'response' in e) {
        const resp = (e as { response?: { data?: unknown } }).response;
        
        if (resp?.data) {
          if (typeof resp.data === 'string') {
            message = resp.data;
          } else if (typeof resp.data === 'object') {
            const data = resp.data as Record<string, unknown>;
            message = (data.message as string) || 
                     (data.error as string) || 
                     (data.details as string) ||
                     message;
          }
        }
      }
      
      // Restore slots from current schedule after backend rejection
      if (currentSchedule?.timeSlots && isTechnician) {
        const enumSlots = currentSchedule.timeSlots
          .map(toTimeSlotEnum)
          .filter((s): s is TimeSlotType => s !== null);
        setTechSlots(enumSlots);
      }
      
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
          <h2>Update Schedule for {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</h2>
          <button className="close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="content">
          <div className="day-block">
            <div className="day-header">
              <span>{dayOfWeek.charAt(0) + dayOfWeek.slice(1).toLowerCase()}</span>
            </div>
            
            {!isTechnician ? (
              <div className="slot">
                <label>
                  <span>Start</span>
                  <input
                    type="time"
                    value={nonTechSlot.start}
                    onChange={e => updateNonTechSlot('start', e.target.value)}
                    disabled
                  />
                </label>
                <label>
                  <span>End (hour only)</span>
                  <select
                    value={nonTechSlot.end}
                    onChange={e => updateNonTechSlot('end', e.target.value)}
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
                <div style={{ marginBottom: '16px' }}>
                  {AVAILABLE_SLOTS.map(slot => {
                    const isSelected = techSlots.includes(slot);
                    
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            // Try to remove, but will auto re-add if it has an appointment
                            const idx = techSlots.indexOf(slot);
                            removeTechSlot(idx);
                          } else {
                            addTechSlot(slot);
                          }
                        }}
                        style={{
                          display: 'inline-block',
                          margin: '4px',
                          padding: '10px 16px',
                          backgroundColor: isSelected ? '#7a0901' : '#fff',
                          color: isSelected ? '#fff' : '#7a0901',
                          border: `2px solid ${isSelected ? '#7a0901' : '#e4e2df'}`,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.95rem',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = '#f8f4f2';
                            e.currentTarget.style.borderColor = '#7a0901';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = '#fff';
                            e.currentTarget.style.borderColor = '#e4e2df';
                          }
                        }}
                      >
                        {SLOT_LABELS[slot]}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="footer">
          <button 
            className="secondary" 
            onClick={onClose}
            style={{
              background: 'linear-gradient(90deg, #d4d3d1 0%, #e4e2df 100%)',
              color: '#333',
              fontWeight: 600,
              fontSize: '1rem',
              padding: '12px 30px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(90deg, #c4c3c1 0%, #d4d2cf 100%)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(90deg, #d4d3d1 0%, #e4e2df 100%)';
            }}
          >
            Cancel
          </button>
          <button 
            className="primary" 
            onClick={submit} 
            disabled={submitting}
            style={{
              background: submitting 
                ? 'linear-gradient(90deg, #888 60%, #999 100%)'
                : 'linear-gradient(90deg, #7a0901 60%, #a32c1a 100%)',
              color: '#fff',
              fontWeight: 600,
              fontSize: '1rem',
              padding: '12px 30px',
              border: 'none',
              borderRadius: '8px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              if (!submitting) {
                e.currentTarget.style.background = 'linear-gradient(90deg, #5a0701 60%, #831f0f 100%)';
              }
            }}
            onMouseLeave={(e) => {
              if (!submitting) {
                e.currentTarget.style.background = 'linear-gradient(90deg, #7a0901 60%, #a32c1a 100%)';
              }
            }}
          >
            {submitting ? 'Updating...' : 'Update This Day'}
          </button>
        </div>
      </div>
    </div>
  );
}
