import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getMyAppointments } from "../../features/appointment/api/getMyAppointments";
import type { AppointmentResponseModel } from "../../features/appointment/models/AppointmentResponseModel";
import AddAppointmentModal from "../../features/appointment/components/AddAppointmentModal";
import { patchAppointmentStatus } from "../../features/appointment/api/patchAppointmentStatus";
import Toast from "../../shared/components/Toast";
import useAuthStore from "../../features/authentication/store/authStore";
import { MapPin, Clock, User, Wrench, DollarSign, AlertCircle, Edit, X } from "lucide-react";
import "./MyAppointmentsPage.css";

export default function MyAppointmentsPage(): React.ReactElement {
  const { t, i18n } = useTranslation();
  const [appointments, setAppointments] = useState<AppointmentResponseModel[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentResponseModel | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingAppointment, setEditingAppointment] = useState<AppointmentResponseModel | null>(null);
  
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
    setEditingAppointment(null);
    fetchAppointments();
    setToast({ 
      message: editingAppointment 
        ? t('pages.appointments.appointmentUpdated') 
        : t('pages.appointments.appointmentCreated'), 
      type: "success" 
    });
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm(t('pages.appointments.confirmCancel'))) {
      return;
    }

    try {
      await patchAppointmentStatus(appointmentId, { status: "CANCELLED" });
      fetchAppointments();
      setToast({ message: t('pages.appointments.appointmentCancelled'), type: "success" });
    } catch (error: unknown) {
      console.error("Error cancelling appointment:", error);
      setToast({ message: t('pages.appointments.errorCancelling'), type: "error" });
    }
  };

  const handleEditAppointment = (appointment: AppointmentResponseModel) => {
    setEditingAppointment(appointment);
    setShowAddModal(true);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';
    return date.toLocaleDateString(locale, {
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
                      <strong>{t('pages.appointments.start')}:</strong> {appointment.appointmentStartTime}
                      {" | "}
                      <strong>{t('pages.appointments.end')}:</strong> {appointment.appointmentEndTime}
                    </>
                  )}
                </span>
              </div>

              {/* Technician */}
              <div className="appointment-info-row">
                <User size={18} />
                <span>
                  {t('pages.appointments.technician')}: {appointment.technicianFirstName} {appointment.technicianLastName}
                </span>
              </div>

              {/* Cellar */}
              <div className="appointment-info-row">
                <Wrench size={18} />
                <span>{t('pages.appointments.cellar')}: {appointment.cellarName}</span>
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
                <span>${appointment.hourlyRate.toFixed(2)}{t('pages.appointments.hour')}</span>
              </div>

              {/* Description */}
              <div className="appointment-description">
                <AlertCircle size={16} />
                <p>{appointment.description}</p>
              </div>

              {/* Action Buttons */}
              <div className="appointment-actions">
                {appointment.status === "SCHEDULED" && (
                  <>
                    <button
                      className="btn-edit"
                      onClick={() => handleEditAppointment(appointment)}
                      title={t('pages.appointments.editAppointment')}
                    >
                      <Edit size={16} />
                      {t('common.edit')}
                    </button>
                    <button
                      className="btn-cancel"
                      onClick={() => handleCancelAppointment(appointment.appointmentId)}
                      title={t('pages.appointments.cancelAppointment')}
                    >
                      <X size={16} />
                      {t('common.cancel')}
                    </button>
                  </>
                )}
              </div>

              {/* View Details Button */}
              <button
                className="btn-view-details"
                onClick={() => setSelectedAppointment(appointment)}
              >
                {t('pages.appointments.viewFullDetails')}
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
              <h2>{t('pages.appointments.appointmentDetails')}</h2>
              <button className="modal-close-light" onClick={() => setSelectedAppointment(null)}>
                &#10005;
              </button>
            </div>

            <div className="modal-content-light">
              <div className="detail-section">
                <h3>{t('pages.appointments.serviceInformation')}</h3>
                <p><strong>{t('pages.appointments.job')}:</strong> {selectedAppointment.jobName}</p>
                <p><strong>{t('pages.appointments.type')}:</strong> {selectedAppointment.jobType}</p>
                <p><strong>{t('pages.appointments.rate')}:</strong> ${selectedAppointment.hourlyRate.toFixed(2)}/hour</p>
                <p><strong>{t('pages.appointments.status')}:</strong> <span className={`modal-status-badge ${getStatusBadge(selectedAppointment.status)}`}>{selectedAppointment.status}</span></p>
              </div>

              <div className="detail-section">
                <h3>{t('pages.appointments.appointmentTime')}</h3>
                <p>
                  {formatDate(selectedAppointment.appointmentDate)}
                  {selectedAppointment.appointmentStartTime && selectedAppointment.appointmentEndTime && (
                    <>
                      <br />
                      <strong>{t('pages.appointments.start')}:</strong> {selectedAppointment.appointmentStartTime}
                      {" | "}
                      <strong>{t('pages.appointments.end')}:</strong> {selectedAppointment.appointmentEndTime}
                    </>
                  )}
                </p>
              </div>

              <div className="detail-section">
                <h3>{t('pages.appointments.technician')}</h3>
                <p><strong>{t('pages.appointments.name')}:</strong> {selectedAppointment.technicianFirstName} {selectedAppointment.technicianLastName}</p>
                {selectedAppointment.technicianRole && (
                  <p><strong>{t('pages.appointments.role')}:</strong> {typeof selectedAppointment.technicianRole === 'string' ? selectedAppointment.technicianRole : 'TECHNICIAN'}</p>
                )}
              </div>

              <div className="detail-section">
                <h3>{t('pages.appointments.cellar')}</h3>
                <p>{selectedAppointment.cellarName}</p>
              </div>

              <div className="detail-section">
                <h3>{t('pages.appointments.serviceLocation')}</h3>
                <p>{selectedAppointment.appointmentAddress.streetAddress}</p>
                <p>{selectedAppointment.appointmentAddress.city}, {selectedAppointment.appointmentAddress.province}</p>
                <p>{selectedAppointment.appointmentAddress.country} {selectedAppointment.appointmentAddress.postalCode}</p>
              </div>

              <div className="detail-section">
                <h3>{t('pages.appointments.description')}</h3>
                <p>{selectedAppointment.description}</p>
              </div>

              <div className="detail-section">
                <h3>{t('pages.appointments.contactInformation')}</h3>
                <p><strong>{t('pages.appointments.customer')}:</strong> {selectedAppointment.customerFirstName} {selectedAppointment.customerLastName}</p>
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
          onClose={() => {
            setShowAddModal(false);
            setEditingAppointment(null);
          }}
          onCreated={handleCreated}
          editAppointment={editingAppointment || undefined}
        />
      )}
    </div>
  );
}
