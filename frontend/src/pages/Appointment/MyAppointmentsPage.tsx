import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getMyAppointments } from "../../features/appointment/api/getMyAppointments";
import type { AppointmentResponseModel } from "../../features/appointment/models/AppointmentResponseModel";
import AddAppointmentModal from "../../features/appointment/components/AddAppointmentModal";
import Toast from "../../shared/components/Toast";
import useAuthStore from "../../features/authentication/store/authStore";
import { MapPin, Clock, User, Wrench, DollarSign, AlertCircle } from "lucide-react";
import "./MyAppointmentsPage.css";

export default function MyAppointmentsPage(): React.ReactElement {
  const { t } = useTranslation();
  const [appointments, setAppointments] = useState<AppointmentResponseModel[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentResponseModel | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  
  const { user, customerData } = useAuthStore();

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyAppointments();
      setAppointments(data);
    } catch (error: unknown) {
      console.error("Error fetching appointments:", error);
      
      // Check if it's a 404 or permission error
      if (error instanceof Error && 'response' in error) {
        const axiosError = error as { response?: { status: number; data?: { message: string } } };
        if (axiosError.response?.status === 404) {
          setError(axiosError.response?.data?.message || "Customer not found or you don't have permission to view these appointments");
          setAppointments([]);
          return;
        }
        if (axiosError.response?.status === 403) {
          setError("You don't have permission to view appointments. Please ensure you're logged in as a customer.");
          setAppointments([]);
          return;
        }
      }
      
      setToast({
        message: "Failed to fetch appointments",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreated = () => {
    setShowAddModal(false);
    fetchAppointments();
    setToast({ message: "Appointment created", type: "success" });
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
        <h1 className="appointments-title-light">{t('pages.appointments.myAppointments')}</h1>
        {customerData?.firstName && customerData?.lastName && (
          <p className="user-name-display">{t('common.welcome')}, {customerData.firstName} {customerData.lastName}</p>
        )}
        <p className="appointments-subtitle">{t('pages.appointments.viewAndManageAppointments')}</p>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            {t('pages.appointments.bookAppointment')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>{t('common.loading')}</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <h3>{t('messages.error')}</h3>
          <p>{error}</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="empty-state">
          <h3>{t('pages.appointments.noAppointments')}</h3>
          <p>{t('pages.appointments.noAppointmentsYet')}</p>
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
                <span>
                  {formatDate(appointment.appointmentDate)}
                  {appointment.appointmentStartTime && appointment.appointmentEndTime && (
                    <>
                      {" | "}
                      <strong>Start:</strong> {appointment.appointmentStartTime}
                      {" | "}
                      <strong>End:</strong> {appointment.appointmentEndTime}
                    </>
                  )}
                </span>
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
                <p>
                  {formatDate(selectedAppointment.appointmentDate)}
                  {selectedAppointment.appointmentStartTime && selectedAppointment.appointmentEndTime && (
                    <>
                      <br />
                      <strong>Start:</strong> {selectedAppointment.appointmentStartTime}
                      {" | "}
                      <strong>End:</strong> {selectedAppointment.appointmentEndTime}
                    </>
                  )}
                </p>
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

      {showAddModal && (
        <AddAppointmentModal
          mode="customer"
          onClose={() => setShowAddModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
