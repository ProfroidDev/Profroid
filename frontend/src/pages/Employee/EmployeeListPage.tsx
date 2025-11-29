import React, { useEffect, useState } from "react";
import { getEmployees } from "../../features/employee/api/getAllEmployees";
import { getEmployee } from "../../features/employee/api/getEmployeeById";
import type { EmployeeResponseModel } from "../../features/employee/models/EmployeeResponseModel";

import "./EmployeeListPage.css";

export default function EmployeeListPage(): React.ReactElement {
  const [employees, setEmployees] = useState<EmployeeResponseModel[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedEmployee, setSelectedEmployee] =
    useState<EmployeeResponseModel | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);

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
  }

  return (
    <div className="employees-page-light">
      <h2 className="employees-title-light">Employees</h2>

      <div className="employees-card-light">
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
    </div>
  );
}
