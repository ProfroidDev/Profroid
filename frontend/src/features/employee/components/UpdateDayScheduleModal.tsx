import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './AddScheduleModal.css'; // Reuse same styles
import { patchDateSchedule } from '../../employee/api/patchDateSchedule';
import type { PatchDateScheduleRequest } from '../../employee/api/patchDateSchedule';
import type {
  DayOfWeekType,
  TimeSlotType,
} from '../../employee/models/EmployeeScheduleRequestModel';
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

const NON_TECH_SLOTS: TimeSlotType[] = ['NINE_AM', 'ELEVEN_AM', 'ONE_PM', 'THREE_PM'];

function getAvailableSlots(isTechnician: boolean): TimeSlotType[] {
  return isTechnician ? ['NINE_AM', 'ELEVEN_AM', 'ONE_PM', 'THREE_PM'] : AVAILABLE_SLOTS;
}

const SLOT_KEYS: Record<TimeSlotType, string> = {
  NINE_AM: 'common.timeSlot.nineAm',
  ELEVEN_AM: 'common.timeSlot.elevenAm',
  ONE_PM: 'common.timeSlot.onePm',
  THREE_PM: 'common.timeSlot.threePm',
  FIVE_PM: 'common.timeSlot.fivePm',
};

// Helper to convert display time to TimeSlotType enum
function toTimeSlotEnum(displayTime: string): TimeSlotType | null {
  const slotLabels: Record<TimeSlotType, string> = {
    NINE_AM: '9:00 AM',
    ELEVEN_AM: '11:00 AM',
    ONE_PM: '1:00 PM',
    THREE_PM: '3:00 PM',
    FIVE_PM: '5:00 PM',
  };
  const entry = Object.entries(slotLabels).find(([, label]) => label === displayTime);
  return entry ? (entry[0] as TimeSlotType) : null;
}

// Helper to convert time string (HH:mm) to TimeSlotType
function timeStringToEnum(time: string): TimeSlotType | null {
  switch (time) {
    case '09:00':
      return 'NINE_AM';
    case '11:00':
      return 'ELEVEN_AM';
    case '13:00':
      return 'ONE_PM';
    case '15:00':
      return 'THREE_PM';
    case '17:00':
      return 'FIVE_PM';
    default:
      return null;
  }
}

function toMinutes(slot: TimeSlotType): number {
  switch (slot) {
    case 'NINE_AM':
      return 9 * 60;
    case 'ELEVEN_AM':
      return 11 * 60;
    case 'ONE_PM':
      return 13 * 60;
    case 'THREE_PM':
      return 15 * 60;
    case 'FIVE_PM':
      return 17 * 60;
  }
}

function parseTime(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function slotToTimeValue(slot: TimeSlotType): string {
  switch (slot) {
    case 'NINE_AM':
      return '09:00';
    case 'ELEVEN_AM':
      return '11:00';
    case 'ONE_PM':
      return '13:00';
    case 'THREE_PM':
      return '15:00';
    case 'FIVE_PM':
      return '17:00';
  }
}

function getAvailableEndTimes(startTime: string, isTechnician: boolean): string[] {
  const startMinutes = parseTime(startTime);

  const allTimes: Array<{ time: string; minutes: number }> = [
    { time: '09:00', minutes: 9 * 60 },
    { time: '11:00', minutes: 11 * 60 },
    { time: '13:00', minutes: 13 * 60 },
    { time: '15:00', minutes: 15 * 60 },
    { time: '17:00', minutes: 17 * 60 },
  ];

  let validTimes = allTimes.filter((t) => t.minutes > startMinutes);

  if (!isTechnician) {
    const maxEndMinutes = startMinutes + 8 * 60;
    validTimes = validTimes.filter((t) => t.minutes <= maxEndMinutes);
  }

  return validTimes.map((t) => t.time);
}

export default function UpdateDayScheduleModal({
  employeeId,
  isTechnician,
  selectedDate,
  currentSchedule,
  onClose,
  onUpdated,
  onError,
}: Props) {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);

  const dayOfWeek = selectedDate
    .toLocaleDateString('en-US', { weekday: 'long' })
    .toUpperCase() as DayOfWeekType;
  const formattedDate = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD

  function getDayLabelTranslationKey(day: DayOfWeekType): string {
    switch (day) {
      case 'MONDAY':
        return 'common.dayOfWeek.monday';
      case 'TUESDAY':
        return 'common.dayOfWeek.tuesday';
      case 'WEDNESDAY':
        return 'common.dayOfWeek.wednesday';
      case 'THURSDAY':
        return 'common.dayOfWeek.thursday';
      case 'FRIDAY':
        return 'common.dayOfWeek.friday';
      default:
        return '';
    }
  }

  const [nonTechSlot, setNonTechSlot] = useState<NonTechSlot>({ start: '09:00', end: '' });
  const [techSlots, setTechSlots] = useState<TechSlot[]>([]);

  // Pre-populate with existing schedule
  useEffect(() => {
    console.log('Modal received currentSchedule:', currentSchedule);
    if (!currentSchedule || !currentSchedule.timeSlots || currentSchedule.timeSlots.length === 0) {
      console.log('No currentSchedule or timeSlots, skipping pre-population');
      return;
    }

    if (!isTechnician) {
      // Non-tech: extract start and end times
      const enumSlots = currentSchedule.timeSlots
        .map(toTimeSlotEnum)
        .filter((s): s is TimeSlotType => s !== null)
        .sort((a, b) => toMinutes(a) - toMinutes(b));

      if (enumSlots.length >= 2) {
        const endSlot = enumSlots[1];
        let endTime = '17:00';
        if (endSlot === 'ELEVEN_AM') endTime = '11:00';
        else if (endSlot === 'ONE_PM') endTime = '13:00';
        else if (endSlot === 'THREE_PM') endTime = '15:00';

        setNonTechSlot({
          start: '09:00',
          end: endTime,
        });
      }
    } else {
      // Technician: extract all slots
      const enumSlots = currentSchedule.timeSlots
        .map(toTimeSlotEnum)
        .filter((s): s is TimeSlotType => s !== null);
      console.log('Setting tech slots:', enumSlots);
      setTechSlots(enumSlots);
    }
  }, [currentSchedule, isTechnician]);

  function updateNonTechSlot(field: 'start' | 'end', value: string) {
    setNonTechSlot((prev) => ({ ...prev, [field]: value }));
  }

  function addTechSlot(slot: TechSlot) {
    setTechSlots((prev) => [...prev, slot]);
  }

  function removeTechSlot(idx: number) {
    const newSlots = techSlots.filter((_, i) => i !== idx);
    setTechSlots(newSlots);
  }

  function validate(): string | null {
    if (!isTechnician) {
      if (!nonTechSlot.end) {
        return t('error.schedule.selectEndTime');
      }
      const start = timeStringToEnum(nonTechSlot.start);
      const end = timeStringToEnum(nonTechSlot.end);
      if (!start || !end) {
        return t('error.schedule.invalidTimeSelection');
      }
      if (toMinutes(end) <= toMinutes(start)) {
        return t('error.schedule.endTimeAfterStart');
      }
      const dailyHours = (toMinutes(end) - toMinutes(start)) / 60;
      if (dailyHours > 8) {
        return t('error.schedule.nonTechnicianMaxHours');
      }
    } else {
      if (techSlots.length === 0) {
        return t('error.schedule.addAtLeastOneTimeSlot');
      }
      if (techSlots.length > 4) {
        return t('error.schedule.technicianMaxHoursPerDay', {
          day: t(getDayLabelTranslationKey(dayOfWeek)),
        });
      }
      const sortedMinutes = techSlots.map(toMinutes).sort((a, b) => a - b);
      for (let i = 1; i < sortedMinutes.length; i++) {
        if (sortedMinutes[i] - sortedMinutes[i - 1] < 120) {
          return t('error.schedule.technicianSlotsTwoHoursApart');
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
      console.log('Sending PATCH request:', payload);
      console.log('Current schedule before PATCH:', currentSchedule);
      await patchDateSchedule(payload);
      console.log('PATCH successful');
      onUpdated();
      // Give parent time to close modal, or close after timeout
      setTimeout(() => {
        onClose();
      }, 500);
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
            message =
              (data.message as string) ||
              (data.error as string) ||
              (data.details as string) ||
              message;
          }
        }
      }

      // Translate known error messages
      if (
        message ===
        'Cannot edit schedule; there is an appointment on this date at a time slot you are removing.'
      ) {
        message = t('error.schedule.cannotEditScheduleAppointmentConflict');
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
          <h2>
            {t('pages.employees.updateScheduleForDate', {
              date: `${t(getDayLabelTranslationKey(dayOfWeek))}, ${selectedDate.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}`,
            })}
          </h2>
          <button className="close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="content">
          <div className="day-block">
            <div className="day-header">
              <span>{t(getDayLabelTranslationKey(dayOfWeek))}</span>
            </div>

            {!isTechnician ? (
              <div className="slot">
                <label>
                  <span>{t('pages.employees.start')}</span>
                  <select
                    value={nonTechSlot.start}
                    onChange={(e) => updateNonTechSlot('start', e.target.value)}
                    className="hour-select"
                  >
                    <option value="">Select Start Time</option>
                    {NON_TECH_SLOTS.map((slot) => (
                      <option key={slot} value={slotToTimeValue(slot)}>
                        {t(SLOT_KEYS[slot])}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>{t('pages.employees.end')}</span>
                  <select
                    value={nonTechSlot.end}
                    onChange={(e) => updateNonTechSlot('end', e.target.value)}
                    className="hour-select"
                  >
                    <option value="">{t('pages.employees.selectHour')}</option>
                    {getAvailableEndTimes(nonTechSlot.start, false)
                      .map((time) => ({ time, slot: timeStringToEnum(time) }))
                      .filter(
                        (item): item is { time: string; slot: TimeSlotType } => item.slot !== null
                      )
                      .map(({ time, slot }) => (
                        <option key={time} value={time}>
                          {t(SLOT_KEYS[slot])}
                        </option>
                      ))}
                  </select>
                </label>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '16px' }}>
                  {getAvailableSlots(isTechnician).map((slot) => {
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
                        {t(SLOT_KEYS[slot])}
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
                e.currentTarget.style.background =
                  'linear-gradient(90deg, #5a0701 60%, #831f0f 100%)';
              }
            }}
            onMouseLeave={(e) => {
              if (!submitting) {
                e.currentTarget.style.background =
                  'linear-gradient(90deg, #7a0901 60%, #a32c1a 100%)';
              }
            }}
          >
            {submitting ? t('common.updating') : t('pages.employees.updateThisDay')}
          </button>
        </div>
      </div>
    </div>
  );
}
