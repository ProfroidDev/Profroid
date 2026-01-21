import React, { useEffect, useState } from 'react';
import './EmployeeSchedulePage.css';
import AddScheduleModal from '../../features/employee/components/AddScheduleModal';
import { getEmployeeSchedule } from '../../features/employee/api/getEmployeeSchedule';

type ScheduleSummary = { hasSchedule: boolean; isTechnician: boolean };

export default function EmployeeSchedulePage(): React.ReactElement {
  // Replace with real route/context employee id - for now using placeholder
  const idFromContext =
    typeof window !== 'undefined'
      ? (window as Window & { __employeeId?: string }).__employeeId
      : undefined;
  const [employeeId] = useState<string | null>(idFromContext || null);
  const [summary, setSummary] = useState<ScheduleSummary | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    async function load() {
      if (!employeeId) return;
      try {
        const sched = await getEmployeeSchedule(employeeId);
        const hasSchedule = Array.isArray(sched) && sched.length > 0;
        const isTechnician = false; // Will be determined from employee data
        setSummary({ hasSchedule, isTechnician });
      } catch {
        setSummary({ hasSchedule: false, isTechnician: false });
      }
    }
    load();
  }, [employeeId]);

  async function refresh() {
    if (!employeeId) return;
    try {
      const sched = await getEmployeeSchedule(employeeId);
      const hasSchedule = Array.isArray(sched) && sched.length > 0;
      const isTechnician = false; // Will be determined from employee data
      setSummary({ hasSchedule, isTechnician });
    } catch {
      setSummary({ hasSchedule: false, isTechnician: false });
    }
  }

  return (
    <div className="schedule-page-light">
      <h2 className="schedule-title-light">Employee Schedule</h2>

      <div className="schedule-card-light">
        {summary?.hasSchedule ? (
          <div className="schedule-placeholder">
            <p>Schedule already exists for this employee.</p>
          </div>
        ) : (
          <div className="schedule-placeholder">
            <p>No schedule found for this employee.</p>
            <button className="primary" onClick={() => setModalOpen(true)}>
              Add Schedule
            </button>
          </div>
        )}
      </div>

      {modalOpen && summary && employeeId && (
        <AddScheduleModal
          employeeId={employeeId}
          isTechnician={summary.isTechnician}
          onClose={() => setModalOpen(false)}
          onAdded={refresh}
        />
      )}
    </div>
  );
}
