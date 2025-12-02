import React, { useEffect, useState } from "react";
import { getEmployees } from "../../features/employee/api/getAllEmployees";
import { getEmployee } from "../../features/employee/api/getEmployeeById";
import type { EmployeeResponseModel } from "../../features/employee/models/EmployeeResponseModel";
import type { EmployeeSchedule } from "../../features/employee/models/EmployeeSchedule";
import { getEmployeeSchedule } from "../../features/employee/api/getEmployeeSchedule";
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import EmployeeAddModal from "../../components/EmployeeAddModal";
import EmployeeEditModal from "../../components/EmployeeEditModal";
import Toast from "../../shared/components/Toast";
import AddScheduleModal from "../../features/employee/components/AddScheduleModal";

import "./EmployeeListPage.css";

export default function EmployeeListPage(): React.ReactElement {
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
  const [addModalOpen, setAddModalOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [editEmployee, setEditEmployee] = useState<EmployeeResponseModel | null>(null);

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
      // Extract ID from the employeeIdentifier value object
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

  return (
    <div className="employees-page-light">
      <h2 className="employees-title-light">Employees</h2>

      <div className="employees-card-light">
        <button 
          className="btn-add-employee" 
          onClick={() => setAddModalOpen(true)}
          style={{ marginBottom: '20px' }}
        >
          + Add New Employee
        </button>

        {loading ? (
          <div className="loading-light">Loading employees...</div>
        ) : (
          <table className="employees-table-light">
            <thead>
              <tr>
                <th>Name</th>
                <th>First Name</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {employees.map((e, idx) => (
                <tr key={idx}>
                  <td>{e.lastName}</td>
                  <td>{e.firstName}</td>
                  <td>
                    <button
                      className="btn-view-light"
                      onClick={() => openDetails(e)}
                    >
                      View Details
                    </button>
                    <button
                      className="btn-view-light"
                      style={{ marginLeft: 8 }}
                      onClick={() => openEditModal(e)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-view-light"
                      style={{ marginLeft: 8 }}
                      onClick={() => openSchedule(e)}
                    >
                      View Schedule
                    </button>
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
              <h3>Employee Details</h3>
              <button className="modal-close-light" onClick={closeModal}>
                ✕
              </button>
            </div>

            {detailLoading && (
              <div className="loading-light">Loading details...</div>
            )}

            {!detailLoading && selectedEmployee && (
              <div className="modal-content-light">
                {/* Section: Identity */}
                <div className="modal-section">
                  <h4 className="modal-label">Employee ID</h4>
                  <p className="modal-value">
                    {((selectedEmployee.employeeIdentifier as EmployeeResponseModel['employeeIdentifier'] & Record<string, unknown>) || {})?.employeeId || "N/A"}
                  </p>
                </div>

                <div className="modal-section">
                  <h4 className="modal-label">Name</h4>
                  <p className="modal-value">
                    {selectedEmployee.firstName} {selectedEmployee.lastName}
                  </p>
                </div>

                {/* Section: Role */}
                <div className="modal-section">
                  <h4 className="modal-label">Role</h4>
                  <p className="modal-value">
                    {String((selectedEmployee.employeeRole as unknown as Record<string, string>)?.employeeRoleType || "N/A")}
                  </p>
                </div>

                {/* Section: Phones */}
                <div className="modal-section">
                  <h4 className="modal-label">Phone Numbers</h4>
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
                  <h4 className="modal-label">Address</h4>
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
                  <h4 className="modal-label">UserId</h4>
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
              <h3>Employee Schedule</h3>
              <button className="modal-close-light" onClick={closeModal}>
                ✕
              </button>
            </div>
            {scheduleLoading && (
              <div className="loading-light">Loading schedule...</div>
            )}
            {!scheduleLoading && employeeSchedule.length > 0 && (
              <div className="modal-content-light">
                <div className="modal-section schedule-calendar-section">
                  <h4 className="modal-label">Select Date</h4>
                  <div className="calendar-center">
                    <Calendar
                      onChange={(date) => setSelectedDate(date as Date | null)}
                      value={selectedDate}
                    />
                  </div>
                </div>
                <div className="modal-section">
                  <h4 className="modal-label">Time Slots</h4>
                  <ul className="modal-list">
                    {(() => {
                      if (!selectedDate) return <li className="modal-list-item">Select a date</li>;
                      // Get the day of week for the selected date
                      const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
                      const sched = employeeSchedule.find(s => s.dayOfWeek.toUpperCase() === dayOfWeek);
                      if (!sched || !sched.timeSlots.length) return <li className="modal-list-item">No schedule for this date</li>;
                      return sched.timeSlots.map((slot, i) => (
                        <li key={i} className="modal-list-item">{slot}</li>
                      ));
                    })()}
                  </ul>
                </div>
              </div>
            )}
            {!scheduleLoading && employeeSchedule.length === 0 && (
              <div className="modal-content-light">
                <div className="modal-section">
                  <h4 className="modal-label">No schedule found.</h4>
                  <button className="btn-view-light" onClick={() => setAddScheduleOpen(true)}>Add Schedule</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <EmployeeAddModal 
        isOpen={addModalOpen} 
        onClose={() => setAddModalOpen(false)}
        onSuccess={() => {
          setAddModalOpen(false);
          setToast({ message: 'Employee added successfully!', type: 'success' });
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
              setToast({ message: 'Schedule added successfully!', type: 'success' });
            }
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
            setToast({ message: 'Employee updated successfully!', type: 'success' });
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
    </div>
  );
}
