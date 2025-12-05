import React, { useEffect, useState } from "react";
import { getMyAppointments } from "../../features/appointment/api/getMyAppointments";
import type { AppointmentResponseModel } from "../../features/appointment/models/AppointmentResponseModel";
import Toast from "../../shared/components/Toast";
import { Calendar, MapPin, Clock, User, Wrench, DollarSign, AlertCircle } from "lucide-react";
import "./MyAppointmentsPage.css";

// Default test customer ID from backend
const DEFAULT_CUSTOMER_ID = "123e4567-e89b-12d3-a456-426614174000"; // John Doe

export default function MyAppointmentsPage(): React.ReactElement {
  const [appointments, setAppointments] = useState<AppointmentResponseModel[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentResponseModel | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  
  // For testing: allow switching customer ID
  const [customerId, setCustomerId] = useState<string>(DEFAULT_CUSTOMER_ID);
  const [showIdInput, setShowIdInput] = useState<boolean>(false);

  useEffect(() => {
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const data = await getMyAppointments(customerId);
      setAppointments(data);
    } catch (error: unknown) {
      console.error("Error fetching appointments:", error);
      setToast({
        message: "Failed to fetch appointments",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getStatusBadge = (status: string): string => {
    switch (status) {
      case "SCHEDULED":
        return "status-scheduled";
      case "COMPLETED":
        return "status-completed";
      case "CANCELLED":
        return "status-cancelled";
      default:
        return "";
    }
  };

  return (
    <div className="appointments-page-light">
      <div className="appointments-header">
        <h1 className="appointments-title-light">My Appointments</h1>
        {appointments.length > 0 && (
          <p className="user-name-display">Welcome, {appointments[0].customerFirstName} {appointments[0].customerLastName}</p>
        )}
        <p className="appointments-subtitle">View and manage your scheduled service appointments</p>
        
        {/* Test ID Switcher */}
        <div className="test-switcher">
          <button 
            className="btn-toggle-id"
            onClick={() => setShowIdInput(!showIdInput)}
          >
            Test Mode
          </button>
          
          {showIdInput && (
            <div className="id-input-container">
              <input
                type="text"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                placeholder="Enter Customer ID"
                className="id-input"
              />
              <button onClick={fetchAppointments} className="btn-refresh">
                Refresh
              </button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading your appointments...</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="empty-state">
          <Calendar size={64} strokeWidth={1.5} />
          <h3>No Appointments Found</h3>
          <p>You don't have any scheduled appointments yet.</p>
        </div>
      ) : (
        <div className="appointments-grid">
          {appointments.map((appointment) => (
            <div key={appointment.appointmentId} className="appointment-card">
              {/* Status Badge */}
              <div className={`status-badge ${getStatusBadge(appointment.status)}`}>
                {appointment.status}
              </div>

              {/* Appointment Header */}
              <div className="appointment-header-section">
                <h3 className="appointment-job-name">{appointment.jobName}</h3>
                <span className="appointment-job-type">{appointment.jobType}</span>
              </div>

              {/* Date & Time */}
              <div className="appointment-info-row">
                <Clock size={18} />
                <span>{formatDate(appointment.appointmentDate)}</span>
              </div>

              {/* Technician */}
              <div className="appointment-info-row">
                <User size={18} />
                <span>
                  Technician: {appointment.technicianFirstName} {appointment.technicianLastName}
                </span>
              </div>

              {/* Cellar */}
              <div className="appointment-info-row">
                <Wrench size={18} />
                <span>Cellar: {appointment.cellarName}</span>
              </div>

              {/* Address */}
              <div className="appointment-info-row">
                <MapPin size={18} />
                <span>
                  {appointment.appointmentAddress.streetAddress}, {appointment.appointmentAddress.city}
                </span>
              </div>

              {/* Hourly Rate */}
              <div className="appointment-info-row">
                <DollarSign size={18} />
                <span>${appointment.hourlyRate.toFixed(2)}/hour</span>
              </div>

              {/* Description */}
              <div className="appointment-description">
                <AlertCircle size={16} />
                <p>{appointment.description}</p>
              </div>

              {/* View Details Button */}
              <button
                className="btn-view-details"
                onClick={() => setSelectedAppointment(appointment)}
              >
                View Full Details
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedAppointment && (
        <div className="modal-overlay-light" onClick={() => setSelectedAppointment(null)}>
          <div className="modal-container-light" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-light">
              <h2>Appointment Details</h2>
              <button className="modal-close-light" onClick={() => setSelectedAppointment(null)}>
                &#10005;
              </button>
            </div>

            <div className="modal-content-light">
              <div className="detail-section">
                <h3>Service Information</h3>
                <p><strong>Job:</strong> {selectedAppointment.jobName}</p>
                <p><strong>Type:</strong> {selectedAppointment.jobType}</p>
                <p><strong>Rate:</strong> ${selectedAppointment.hourlyRate.toFixed(2)}/hour</p>
                <p><strong>Status:</strong> <span className={`modal-status-badge ${getStatusBadge(selectedAppointment.status)}`}>{selectedAppointment.status}</span></p>
              </div>

              <div className="detail-section">
                <h3>Appointment Time</h3>
                <p>{formatDate(selectedAppointment.appointmentDate)}</p>
              </div>

              <div className="detail-section">
                <h3>Technician</h3>
                <p><strong>Name:</strong> {selectedAppointment.technicianFirstName} {selectedAppointment.technicianLastName}</p>
                {selectedAppointment.technicianRole && (
                  <p><strong>Role:</strong> {typeof selectedAppointment.technicianRole === 'string' ? selectedAppointment.technicianRole : 'TECHNICIAN'}</p>
                )}
              </div>

              <div className="detail-section">
                <h3>Cellar</h3>
                <p>{selectedAppointment.cellarName}</p>
              </div>

              <div className="detail-section">
                <h3>Service Location</h3>
                <p>{selectedAppointment.appointmentAddress.streetAddress}</p>
                <p>{selectedAppointment.appointmentAddress.city}, {selectedAppointment.appointmentAddress.province}</p>
                <p>{selectedAppointment.appointmentAddress.country} {selectedAppointment.appointmentAddress.postalCode}</p>
              </div>

              <div className="detail-section">
                <h3>Description</h3>
                <p>{selectedAppointment.description}</p>
              </div>

              <div className="detail-section">
                <h3>Contact Information</h3>
                <p><strong>Customer:</strong> {selectedAppointment.customerFirstName} {selectedAppointment.customerLastName}</p>
                {selectedAppointment.customerPhoneNumbers.map((phone, idx) => (
                  <p key={idx}><strong>{phone.type}:</strong> {phone.number}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
