import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './AddScheduleModal.css';
import { addEmployeeSchedule } from '../../employee/api/addEmployeeSchedule';
import type { AddEmployeeScheduleRequest } from '../../employee/api/addEmployeeSchedule';
import type { DayOfWeekType, TimeSlotType } from '../../employee/models/EmployeeScheduleRequestModel';

type Props = {
  employeeId: string; // UUID
  isTechnician: boolean;
  onClose: () => void;
  onAdded: () => void; // refresh callback
  onError?: (message: string) => void; // Optional error callback for toast
};

type NonTechSlot = { start: string; end: string };
type TechSlot = TimeSlotType;

const DAYS: DayOfWeekType[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
const AVAILABLE_SLOTS: TimeSlotType[] = ['NINE_AM', 'ELEVEN_AM', 'ONE_PM', 'THREE_PM', 'FIVE_PM'];

const SLOT_KEYS: Record<TimeSlotType, string> = {
  NINE_AM: 'common.timeSlot.nineAm',
  ELEVEN_AM: 'common.timeSlot.elevenAm',
  ONE_PM: 'common.timeSlot.onePm',
  THREE_PM: 'common.timeSlot.threePm',
  FIVE_PM: 'common.timeSlot.fivePm',
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

export default function AddScheduleModal({ employeeId, isTechnician, onClose, onAdded, onError }: Props) {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  
  // Non-tech: one slot per day with start/end times
  const [nonTechSlots, setNonTechSlots] = useState<Record<DayOfWeekType, NonTechSlot>>(() => ({
    MONDAY: { start: '09:00', end: '' },
    TUESDAY: { start: '09:00', end: '' },
    WEDNESDAY: { start: '09:00', end: '' },
    THURSDAY: { start: '09:00', end: '' },
    FRIDAY: { start: '09:00', end: '' },
  }));
  
  // Tech: array of TimeSlotType per day
  const [techSlots, setTechSlots] = useState<Record<DayOfWeekType, TechSlot[]>>(() => ({
    MONDAY: [],
    TUESDAY: [],
    WEDNESDAY: [],
    THURSDAY: [],
    FRIDAY: [],
  }));

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
        if (!slot.start || !slot.end) return t('error.schedule.dayAndEndTimesRequired', { day: t(`common.dayOfWeek.${day.toLowerCase()}`) });
        if (slot.start !== '09:00') return t('error.schedule.nonTechnicianMustStartNineAm');
        const startMinutes = parseTime(slot.start);
        const endMinutes = parseTime(slot.end);
        if (startMinutes >= endMinutes) return t('error.schedule.startBeforeEnd', { day: t(`common.dayOfWeek.${day.toLowerCase()}`) });
        const dailyHours = (endMinutes - startMinutes) / 60;
        if (dailyHours > 8) return t('error.schedule.nonTechnicianMaxHoursPerDay', { day: t(`common.dayOfWeek.${day.toLowerCase()}`), hours: dailyHours.toFixed(1) });
        weeklyHours += dailyHours;
      } else {
        const slots = techSlots[day];
        if (!slots || slots.length === 0) {
          return t('error.schedule.dayMustHaveTimeSlot', { day: t(`common.dayOfWeek.${day.toLowerCase()}`) });
        }
        const minutesStarts = slots.map(toMinutes).sort((a,b)=>a-b);
        for (let i=1;i<minutesStarts.length;i++) {
          if (minutesStarts[i] - minutesStarts[i-1] < 120) return t('error.schedule.technicianSlotsTwoHoursApart');
        }
        if (slots.length > 4) return t('error.schedule.technicianMaxHoursPerDay', { day: t(`common.dayOfWeek.${day.toLowerCase()}`) });
        weeklyHours += slots.length * 2;
      }
    }

    if (weeklyHours > 40) return t('error.schedule.employeeMaxHoursPerWeek', { hours: weeklyHours.toFixed(1) });
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

    // Build weekly requests from per-day selections
    const weeklyRequests = DAYS.map(day => {
      if (!isTechnician) {
        const slot = nonTechSlots[day];
        const startEnum = toTimeSlotEnum(slot.start);
        const endEnum = toTimeSlotEnum(slot.end);
        const list: TimeSlotType[] = [];
        if (startEnum) list.push(startEnum);
        if (endEnum) list.push(endEnum);
        // Sort non-tech slots by time
        list.sort((a, b) => toMinutes(a) - toMinutes(b));
        return { dayOfWeek: day, timeSlots: list };
      } else {
        // Sort technician slots chronologically
        const sortedSlots = [...techSlots[day]].sort((a, b) => toMinutes(a) - toMinutes(b));
        return { dayOfWeek: day, timeSlots: sortedSlots };
      }
    });

    // Weekly total check: technicians slots*2 <=40 ; non-tech sum of daily hours <=40
    // Weekly check done in validate()

    const payload: AddEmployeeScheduleRequest = {
      employeeId,
      scheduleRequests: weeklyRequests,
    };

    try {
      setSubmitting(true);
      await addEmployeeSchedule(payload);
      // Success handled by parent via onAdded (which shows toast). Remove intrusive alert.
      onAdded();
      onClose();
    } catch (e: unknown) {
      let message = 'Failed to add schedule';
      if (typeof e === 'object' && e && 'response' in e) {
        const resp = (e as { response?: { data?: { message?: string } } }).response;
        message = resp?.data?.message || message;
      }
      if (onError) {
        onError(message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="add-schedule-modal-backdrop">
      <div className="add-schedule-modal">
        <div className="header">
          <h2>{t('pages.employees.addWeeklySchedule')}</h2>
          <button className="close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="content">
          {DAYS.map(day => (
            <div key={day} className="day-block">
              <div className="day-header">
                <span>
                  {t(`common.dayOfWeek.${day.toLowerCase()}`)}
                </span>
              </div>
              
              {!isTechnician ? (
                <div className="slot">
                  <label>
                    <span>{t('pages.employees.start')}</span>
                    <input
                      type="time"
                      value={nonTechSlots[day].start}
                      onChange={e => updateNonTechSlot(day, 'start', e.target.value)}
                      disabled
                    />
                  </label>
                  <label>
                    <span>{t('pages.employees.end')}</span>
                    <select
                      value={nonTechSlots[day].end}
                      onChange={e => updateNonTechSlot(day, 'end', e.target.value)}
                      className="hour-select"
                    >
                      <option value="">{t('pages.employees.selectHour')}</option>
                      <option value="11:00">{t('common.timeSlot.elevenAm')}</option>
                      <option value="13:00">{t('common.timeSlot.onePm')}</option>
                      <option value="15:00">{t('common.timeSlot.threePm')}</option>
                      <option value="17:00">{t('common.timeSlot.fivePm')}</option>
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
                          <span className="slot-label">{t(SLOT_KEYS[slot])}</span>
                          <button className="remove" onClick={() => removeTechSlot(day, originalIdx)} type="button">{t('pages.employees.remove')}</button>
                        </div>
                      );
                    })}
                  <div className="slot-add-controls">
                    {AVAILABLE_SLOTS.map(slotType => (
                      <button
                        key={slotType}
                        className="btn-slot-option"
                        onClick={() => addTechSlot(day, slotType)}
                        type="button"
                        disabled={techSlots[day].includes(slotType)}
                      >
                        {t(SLOT_KEYS[slotType])}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        <div className="footer">
          <button className="secondary" onClick={onClose} disabled={submitting}>{t('common.cancel')}</button>
          <button className="primary" onClick={submit} disabled={submitting}>{t('pages.employees.saveSchedule')}</button>
        </div>
      </div>
    </div>
  );
}
