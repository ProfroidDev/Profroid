import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getEmployees } from "../../features/employee/api/getAllEmployees";
import { getEmployee } from "../../features/employee/api/getEmployeeById";
import { deactivateEmployee } from "../../features/employee/api/deactivateEmployee";
import { reactivateEmployee } from "../../features/employee/api/reactivateEmployee";
import type { EmployeeResponseModel } from "../../features/employee/models/EmployeeResponseModel";
import type { EmployeeSchedule } from "../../features/employee/models/EmployeeSchedule";
import { getEmployeeSchedule } from "../../features/employee/api/getEmployeeSchedule";
import { getEmployeeScheduleForDate } from "../../features/employee/api/getEmployeeScheduleForDate";
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import EmployeeAssignModal from "../../components/EmployeeAssignModal";
import EmployeeEditModal from "../../components/EmployeeEditModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import Toast from "../../shared/components/Toast";
import AddScheduleModal from "../../features/employee/components/AddScheduleModal";
import UpdateScheduleModal from "../../features/employee/components/UpdateScheduleModal";
import UpdateDayScheduleModal from "../../features/employee/components/UpdateDayScheduleModal";

import "./EmployeeListPage.css";

export default function EmployeeListPage(): React.ReactElement {
  const { t } = useTranslation();
  const [employees, setEmployees] = useState<EmployeeResponseModel[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedEmployee, setSelectedEmployee] =
    useState<EmployeeResponseModel | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState<boolean>(false);
  const [scheduleLoading, setScheduleLoading] = useState<boolean>(false);
  const [employeeSchedule, setEmployeeSchedule] = useState<EmployeeSchedule[]>([]);
  const [addScheduleOpen, setAddScheduleOpen] = useState<boolean>(false);
  const [addScheduleEmployeeId, setAddScheduleEmployeeId] = useState<string | null>(null);
  const [scheduleEmployeeData, setScheduleEmployeeData] = useState<EmployeeResponseModel | null>(null);
  // Removed unused selectedDay state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDateSchedule, setSelectedDateSchedule] = useState<EmployeeSchedule | null>(null);

  // Fetch schedule for selected date - check for date-specific schedules
  useEffect(() => {
    async function fetchDateSchedule() {
      if (selectedDate && scheduleEmployeeData) {
        const employeeId = String((scheduleEmployeeData.employeeIdentifier as EmployeeResponseModel['employeeIdentifier'] & Record<string, unknown>)?.employeeId);
        if (employeeId) {
          try {
            const formattedDate = selectedDate.toISOString().split('T')[0];
            const dateSchedule = await getEmployeeScheduleForDate(employeeId, formattedDate);
            if (dateSchedule && dateSchedule.length > 0) {
              setSelectedDateSchedule(dateSchedule[0]);
            } else {
              setSelectedDateSchedule(null);
            }
          } catch (error) {
            console.error('Error fetching date schedule:', error);
            // Fall back to weekly template on error
            const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
            const weeklySchedule = employeeSchedule.find(s => s.dayOfWeek.toUpperCase() === dayOfWeek);
            setSelectedDateSchedule(weeklySchedule || null);
          }
        }
      } else if (selectedDate && employeeSchedule.length > 0) {
        // Fall back to weekly template if no employee data
        const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
        const weeklySchedule = employeeSchedule.find(s => s.dayOfWeek.toUpperCase() === dayOfWeek);
        setSelectedDateSchedule(weeklySchedule || null);
      } else {
        setSelectedDateSchedule(null);
      }
    }
    fetchDateSchedule();
  }, [selectedDate, scheduleEmployeeData, employeeSchedule]);
  const [assignModalOpen, setAssignModalOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [editEmployee, setEditEmployee] = useState<EmployeeResponseModel | null>(null);

  // Update schedule modal state
  const [updateScheduleOpen, setUpdateScheduleOpen] = useState<boolean>(false);
  
  // Update day schedule modal state
  const [updateDayScheduleOpen, setUpdateDayScheduleOpen] = useState<boolean>(false);
  
  // Deactivate/Reactivate state
  const [deactivateLoading, setDeactivateLoading] = useState<boolean>(false);
  
  // Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    type: 'deactivate' | 'reactivate' | null;
    employee: EmployeeResponseModel | null;
  }>({
    isOpen: false,
    type: null,
    employee: null,
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getEmployees();
        console.log("Employees fetched:", data);
        setEmployees(data);
      } catch (error) {
        console.error("Error fetching employees:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function openDetails(employee: EmployeeResponseModel) {
    setModalOpen(true);
    setDetailLoading(true);
    try {
      const employeeId = (employee.employeeIdentifier as EmployeeResponseModel['employeeIdentifier'] & Record<string, unknown>)?.employeeId;
      
      if (employeeId) {
        console.log("Fetching employee with ID:", employeeId);
        const data = await getEmployee(String(employeeId));
        console.log("Employee details fetched:", data);
        setSelectedEmployee(data);
      } else {
        console.warn("No employee ID found, using employee data directly");
        setSelectedEmployee(employee);
      }
    } catch (error) {
      console.error("Error fetching employee details:", error);
      // Fallback: just use the employee data we already have
      setSelectedEmployee(employee);
    } finally {
      setDetailLoading(false);
    }
  }

  function closeModal() {
    setModalOpen(false);
    setSelectedEmployee(null);
    setScheduleModalOpen(false);
    // Removed setSelectedDay
    setSelectedDate(null);
  }

  async function openSchedule(employee: EmployeeResponseModel) {
    setScheduleModalOpen(true);
    setScheduleLoading(true);
    setScheduleEmployeeData(employee);
    try {
      const employeeId = (employee.employeeIdentifier as EmployeeResponseModel['employeeIdentifier'] & Record<string, unknown>)?.employeeId;
      if (employeeId) {
        const scheduleData = await getEmployeeSchedule(String(employeeId));
        setEmployeeSchedule(scheduleData);
        if (!scheduleData || scheduleData.length === 0) {
          setAddScheduleEmployeeId(String(employeeId));
        } else {
          setAddScheduleEmployeeId(null);
        }
      } else {
        setEmployeeSchedule([]);
        setAddScheduleEmployeeId(null);
      }
    } catch (error) {
      console.error("Error fetching employee schedule:", error);
      setEmployeeSchedule([]);
      setAddScheduleEmployeeId(null);
    } finally {
      setScheduleLoading(false);
    }
  }

  function openEditModal(employee: EmployeeResponseModel) {
    setEditEmployee(employee);
    setEditModalOpen(true);
  }

  async function handleDeactivateEmployee(employee: EmployeeResponseModel) {
    setConfirmationModal({
      isOpen: true,
      type: 'deactivate',
      employee,
    });
  }

  async function confirmDeactivate() {
    if (!confirmationModal.employee) return;

    setDeactivateLoading(true);
    try {
      const employeeId = (confirmationModal.employee.employeeIdentifier as EmployeeResponseModel['employeeIdentifier'] & Record<string, unknown>)?.employeeId;
      if (employeeId) {
        const updatedEmployee = await deactivateEmployee(String(employeeId));
        setToast({ message: t('pages.employees.employeeDeactivated', { firstName: confirmationModal.employee.firstName, lastName: confirmationModal.employee.lastName }), type: 'warning' });
        // Update the employee in the list to show deactivated state
        setEmployees(employees.map(e => 
          (e.employeeIdentifier as EmployeeResponseModel['employeeIdentifier'] & Record<string, unknown>)?.employeeId === employeeId 
            ? updatedEmployee 
            : e
        ));
      }
    } catch (error) {
      console.error("Error deactivating employee:", error);
      setToast({ message: t('pages.employees.failedToDeactivate'), type: 'error' });
    } finally {
      setDeactivateLoading(false);
      setConfirmationModal({ isOpen: false, type: null, employee: null });
    }
  }

  async function handleReactivateEmployee(employee: EmployeeResponseModel) {
    setConfirmationModal({
      isOpen: true,
      type: 'reactivate',
      employee,
    });
  }

  async function confirmReactivate() {
    if (!confirmationModal.employee) return;

    setDeactivateLoading(true);
    try {
      const employeeId = (confirmationModal.employee.employeeIdentifier as EmployeeResponseModel['employeeIdentifier'] & Record<string, unknown>)?.employeeId;
      if (employeeId) {
        const updatedEmployee = await reactivateEmployee(String(employeeId));
        setToast({ message: t('pages.employees.employeeReactivated', { firstName: confirmationModal.employee.firstName, lastName: confirmationModal.employee.lastName }), type: 'success' });
        // Update the employee in the list to show reactivated state
        setEmployees(employees.map(e => 
          (e.employeeIdentifier as EmployeeResponseModel['employeeIdentifier'] & Record<string, unknown>)?.employeeId === employeeId 
            ? updatedEmployee 
            : e
        ));
      }
    } catch (error) {
      console.error("Error reactivating employee:", error);
      setToast({ message: t('pages.employees.failedToReactivate'), type: 'error' });
    } finally {
      setDeactivateLoading(false);
      setConfirmationModal({ isOpen: false, type: null, employee: null });
    }
  }

  return (
    <div className="employees-page-light">
      <h2 className="employees-title-light">{t('pages.employees.title')}</h2>

      <div className="employees-card-light">
        <div style={{ marginBottom: '20px' }}>
          <button 
            className="btn-add-employee" 
            onClick={() => setAssignModalOpen(true)}
          >
            + {t('pages.employees.addEmployee')}
          </button>
        </div>

        {loading ? (
          <div className="loading-light">{t('common.loading')}</div>
        ) : (
          <table className="employees-table-light">
            <thead>
              <tr>
                <th>{t('pages.employees.name')}</th>
                <th>{t('auth.firstName')}</th>
                <th>{t('common.edit')}</th>
              </tr>
            </thead>

            <tbody>
              {employees.map((e, idx) => (
                <tr key={idx} className={!e.isActive ? 'row-deactivated' : ''}>
                  <td>{e.lastName}</td>
                  <td>{e.firstName}</td>
                  <td>
                    <button
                      className="btn-view-light"
                      onClick={() => openDetails(e)}
                      disabled={!e.isActive}
                    >
                      {t('pages.employees.viewDetails')}
                    </button>
                    <button
                      className="btn-view-light"
                      style={{ marginLeft: 8 }}
                      onClick={() => openEditModal(e)}
                      disabled={!e.isActive}
                    >
                      {t('common.edit')}
                    </button>
                    <button
                      className="btn-view-light"
                      style={{ marginLeft: 8 }}
                      onClick={() => openSchedule(e)}
                      disabled={!e.isActive}
                    >
                      {t('pages.employees.viewSchedule')}
                    </button>
                    {e.isActive ? (
                      <button
                        className="btn-view-light"
                        style={{ marginLeft: 8, backgroundColor: '#ff6b6b', color: 'white' }}
                        onClick={() => handleDeactivateEmployee(e)}
                        disabled={deactivateLoading}
                      >
                        {t('common.delete')}
                      </button>
                    ) : (
                      <button
                        className="btn-view-light"
                        style={{ marginLeft: 8, backgroundColor: '#51cf66', color: 'white' }}
                        onClick={() => handleReactivateEmployee(e)}
                        disabled={deactivateLoading}
                      >
                        {t('pages.employees.reactivate')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <div className="modal-overlay-light">
          <div className="modal-container-light">
            <div className="modal-header-light">
              <h3>{t('pages.employees.employeeDetails')}</h3>
              <button className="modal-close-light" onClick={closeModal}>
                &#10005;
              </button>
            </div>

            {detailLoading && (
              <div className="loading-light">{t('common.loading')}</div>
            )}

            {!detailLoading && selectedEmployee && (
              <div className="modal-content-light">
                {/* Section: Identity */}
                <div className="modal-section">
                  <h4 className="modal-label">{t('pages.employees.employeeId')}</h4>
                  <p className="modal-value">
                    {((selectedEmployee.employeeIdentifier as EmployeeResponseModel['employeeIdentifier'] & Record<string, unknown>) || {})?.employeeId || "N/A"}
                  </p>
                </div>

                <div className="modal-section">
                  <h4 className="modal-label">{t('pages.employees.name')}</h4>
                  <p className="modal-value">
                    {selectedEmployee.firstName} {selectedEmployee.lastName}
                  </p>
                </div>

                {/* Section: Role */}
                <div className="modal-section">
                  <h4 className="modal-label">{t('pages.employees.role')}</h4>
                  <p className="modal-value">
                    {String((selectedEmployee.employeeRole as unknown as Record<string, string>)?.employeeRoleType || "N/A")}
                  </p>
                </div>

                {/* Section: Phones */}
                <div className="modal-section">
                  <h4 className="modal-label">{t('pages.employees.phoneNumbers')}</h4>
                  <ul className="modal-list">
                    {selectedEmployee.phoneNumbers?.map((p, i) => (
                      <li key={i} className="modal-list-item">
                        <span className="modal-list-type">
                          {String(typeof p.type === 'object' ? (p.type as unknown as Record<string, string>).phoneType : p.type)}
                        </span>
                        <span>{p.number}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Section: Address */}
                <div className="modal-section">
                  <h4 className="modal-label">{t('pages.employees.address')}</h4>
                  <p className="modal-value">
                    {selectedEmployee.employeeAddress?.streetAddress}
                    {selectedEmployee.employeeAddress?.city && `, ${selectedEmployee.employeeAddress.city}`}
                    {selectedEmployee.employeeAddress?.province &&
                      `, ${selectedEmployee.employeeAddress.province}`}
                    <br />
                    {selectedEmployee.employeeAddress?.country} {selectedEmployee.employeeAddress?.postalCode}
                  </p>
                </div>

                <div className="modal-section">
                  <h4 className="modal-label">{t('pages.employees.userId')}</h4>
                  <p className="modal-value">
                    {selectedEmployee.userId}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {scheduleModalOpen && (
        <div className="modal-overlay-light">
          <div className="modal-container-light">
            <div className="modal-header-light">
              <h3>{t('pages.employees.employeeSchedule')}</h3>
              <button className="modal-close-light" onClick={closeModal}>
                &#10005;
              </button>
            </div>
            {scheduleLoading && (
              <div className="loading-light">{t('pages.employees.loadingSchedule')}</div>
            )}
            
            {!scheduleLoading && !scheduleEmployeeData?.isActive && (
              <div className="modal-content-light">
                <div className="modal-section">
                  <h4 className="modal-label" style={{ color: '#ff6b6b' }}>{t('pages.employees.employeeInactive')}</h4>
                  <p className="modal-value">
                    {t('pages.employees.employeeInactiveMessage')}
                  </p>
                </div>
              </div>
            )}
            
            {!scheduleLoading && scheduleEmployeeData?.isActive && employeeSchedule.length > 0 && (
              <div className="modal-content-light">
                <div className="modal-section schedule-calendar-section">
                  <h4 className="modal-label">{t('pages.employees.selectDate')}</h4>
                  <div className="calendar-center">
                    <Calendar
                      onChange={(date) => setSelectedDate(date as Date | null)}
                      value={selectedDate}
                      locale="fr-FR"
                    />
                  </div>
                </div>
                <div className="modal-section">
                  <h4 className="modal-label">{t('pages.employees.timeSlots')}</h4>
                  <ul className="modal-list">
                    {(() => {
                      if (!selectedDate) return <li className="modal-list-item">{t('pages.employees.selectADate')}</li>;
                      
                      // Use selectedDateSchedule which includes date-specific overrides
                      const sched = selectedDateSchedule;
                      if (!sched || !sched.timeSlots || sched.timeSlots.length === 0) {
                        // Fallback: show weekly template while loading
                        const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
                        const weeklySchedule = employeeSchedule.find(s => s.dayOfWeek.toUpperCase() === dayOfWeek);
                        if (weeklySchedule && weeklySchedule.timeSlots && weeklySchedule.timeSlots.length > 0) {
                          return weeklySchedule.timeSlots.map((slot: string, i: number) => (
                            <li key={i} className="modal-list-item">{slot}</li>
                          ));
                        }
                      return <li className="modal-list-item">{t('pages.employees.noScheduleForDate')}</li>;
                      }
                      return sched.timeSlots.map((slot: string, i: number) => (
                        <li key={i} className="modal-list-item">{slot}</li>
                      ));
                    })()}
                  </ul>
                </div>
                <div className="modal-section" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-start' }}>
                  <button 
                    className="btn-view-light" 
                    onClick={() => setUpdateDayScheduleOpen(true)}
                    disabled={!selectedDate}
                  >
                    {t('pages.employees.updateThisDay')}
                  </button>
                  <button className="btn-view-light" onClick={() => setUpdateScheduleOpen(true)}>{t('pages.employees.updateFullWeek')}</button>
                </div>
              </div>
            )}
            {!scheduleLoading && scheduleEmployeeData?.isActive && employeeSchedule.length === 0 && (
              <div className="modal-content-light">
                <div className="modal-section">
                  <h4 className="modal-label">{t('pages.employees.noScheduleFound')}</h4>
                  <button className="btn-view-light" onClick={() => setAddScheduleOpen(true)}>{t('pages.employees.addSchedule')}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <EmployeeAssignModal 
        isOpen={assignModalOpen} 
        onClose={() => setAssignModalOpen(false)}
        onSuccess={() => {
          setAssignModalOpen(false);
          setToast({ message: t('pages.employees.assignedSuccessfully'), type: 'success' });
          // Refresh employee list
          async function load() {
            setLoading(true);
            try {
              const data = await getEmployees();
              setEmployees(data);
            } catch (error) {
              console.error("Error fetching employees:", error);
            } finally {
              setLoading(false);
            }
          }
          load();
        }}
      />

      <EmployeeAssignModal 
        isOpen={assignModalOpen} 
        onClose={() => setAssignModalOpen(false)}
        onSuccess={() => {
          setAssignModalOpen(false);
          setToast({ message: t('pages.employees.assignedSuccessfully'), type: 'success' });
          // Refresh employee list
          async function load() {
            setLoading(true);
            try {
              const data = await getEmployees();
              setEmployees(data);
            } catch (error) {
              console.error("Error fetching employees:", error);
            } finally {
              setLoading(false);
            }
          }
          load();
        }}
      />
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {addScheduleOpen && addScheduleEmployeeId && scheduleEmployeeData && (
        <AddScheduleModal
          employeeId={addScheduleEmployeeId}
          isTechnician={String((scheduleEmployeeData.employeeRole as unknown as Record<string, string>)?.employeeRoleType || "").toUpperCase() === 'TECHNICIAN'}
          onClose={() => setAddScheduleOpen(false)}
          onAdded={async () => {
            if (addScheduleEmployeeId) {
              const scheduleData = await getEmployeeSchedule(addScheduleEmployeeId);
              setEmployeeSchedule(scheduleData);
              setAddScheduleOpen(false);
              setAddScheduleEmployeeId(null);
              setToast({ message: t('pages.employees.scheduleAddedSuccessfully'), type: 'success' });
            }
          }}
          onError={(message: string) => {
            setToast({ message, type: 'error' });
          }}
        />
      )}

      {editModalOpen && editEmployee && (
        <EmployeeEditModal
          isOpen={editModalOpen}
          employee={editEmployee}
          onClose={() => {
            setEditModalOpen(false);
            setEditEmployee(null);
          }}
          onSuccess={() => {
            setToast({ message: t('pages.employees.updatedSuccessfully'), type: 'success' });
            // Refresh employee list
            async function load() {
              setLoading(true);
              try {
                const data = await getEmployees();
                setEmployees(data);
              } catch (error) {
                console.error("Error fetching employees:", error);
              } finally {
                setLoading(false);
              }
            }
            load();
          }}
        />
      )}

      {updateScheduleOpen && scheduleEmployeeData && employeeSchedule.length > 0 && (
        <UpdateScheduleModal
          employeeId={String((scheduleEmployeeData.employeeIdentifier as EmployeeResponseModel['employeeIdentifier'] & Record<string, unknown>)?.employeeId)}
          isTechnician={String((scheduleEmployeeData.employeeRole as unknown as Record<string, string>)?.employeeRoleType || "").toUpperCase() === 'TECHNICIAN'}
          existingSchedule={employeeSchedule}
          onClose={() => setUpdateScheduleOpen(false)}
          onUpdated={async () => {
            const employeeId = String((scheduleEmployeeData.employeeIdentifier as EmployeeResponseModel['employeeIdentifier'] & Record<string, unknown>)?.employeeId);
            if (employeeId) {
              const scheduleData = await getEmployeeSchedule(employeeId);
              setEmployeeSchedule(scheduleData);
              setUpdateScheduleOpen(false);
              setToast({ message: t('pages.employees.scheduleUpdatedSuccessfully'), type: 'success' });
            }
          }}
          onError={(message: string) => {
            setToast({ message, type: 'error' });
          }}
        />
      )}

      {updateDayScheduleOpen && scheduleEmployeeData && employeeSchedule.length > 0 && selectedDate && (
        <UpdateDayScheduleModal
          employeeId={String((scheduleEmployeeData.employeeIdentifier as EmployeeResponseModel['employeeIdentifier'] & Record<string, unknown>)?.employeeId)}
          isTechnician={String((scheduleEmployeeData.employeeRole as unknown as Record<string, string>)?.employeeRoleType || "").toUpperCase() === 'TECHNICIAN'}
          selectedDate={selectedDate}
          currentSchedule={(() => {
            // Use selectedDateSchedule if available, otherwise fall back to weekly template
            if (selectedDateSchedule) return selectedDateSchedule;
            const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
            return employeeSchedule.find(s => s.dayOfWeek.toUpperCase() === dayOfWeek) || null;
          })()}
          onClose={() => setUpdateDayScheduleOpen(false)}
          onUpdated={async () => {
            // After PATCH succeeds, refresh the date-specific schedule
            const employeeId = String((scheduleEmployeeData.employeeIdentifier as EmployeeResponseModel['employeeIdentifier'] & Record<string, unknown>)?.employeeId);
            if (employeeId && selectedDate) {
              try {
                const formattedDate = selectedDate.toISOString().split('T')[0];
                const dateSchedule = await getEmployeeScheduleForDate(employeeId, formattedDate);
                if (dateSchedule && dateSchedule.length > 0) {
                  setSelectedDateSchedule(dateSchedule[0]);
                }
              } catch (error) {
                console.error('Error refreshing date schedule:', error);
              }
              setUpdateDayScheduleOpen(false);
              setToast({ message: t('pages.employees.scheduleUpdatedForDate', { date: selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) }), type: 'success' });
            }
          }}
          onError={(message: string) => {
            setToast({ message, type: 'error' });
          }}
        />
      )}

      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        title={confirmationModal.type === 'deactivate' ? t('pages.employees.deactivateEmployee') : t('pages.employees.reactivateEmployee')}
        message={
          confirmationModal.type === 'deactivate'
            ? t('pages.employees.deactivateConfirmMessage', { firstName: confirmationModal.employee?.firstName, lastName: confirmationModal.employee?.lastName })
            : t('pages.employees.reactivateConfirmMessage', { firstName: confirmationModal.employee?.firstName, lastName: confirmationModal.employee?.lastName })
        }
        confirmText={confirmationModal.type === 'deactivate' ? t('pages.employees.deactivate') : t('pages.employees.reactivate')}
        cancelText={t('common.cancel')}
        isDanger={confirmationModal.type === 'deactivate'}
        isLoading={deactivateLoading}
        onConfirm={confirmationModal.type === 'deactivate' ? confirmDeactivate : confirmReactivate}
        onCancel={() => setConfirmationModal({ isOpen: false, type: null, employee: null })}
      />
    </div>
  );
}
