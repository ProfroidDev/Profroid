import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getMyJobs } from "../../features/appointment/api/getMyJobs";
import type { AppointmentResponseModel } from "../../features/appointment/models/AppointmentResponseModel";
import AddAppointmentModal from "../../features/appointment/components/AddAppointmentModal";
import { patchAppointmentStatus } from "../../features/appointment/api/patchAppointmentStatus";
import Toast from "../../shared/components/Toast";
import useAuthStore from "../../features/authentication/store/authStore";
import ConfirmationModal from "../../components/ConfirmationModal";
import { MapPin, Clock, User, Wrench, DollarSign, Phone, AlertCircle, Edit, CheckCircle, X } from "lucide-react";
import "./MyJobsPage.css";

export default function MyJobsPage(): React.ReactElement {
  const { t, i18n } = useTranslation();
  const [jobs, setJobs] = useState<AppointmentResponseModel[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedJob, setSelectedJob] = useState<AppointmentResponseModel | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingAppointment, setEditingAppointment] = useState<AppointmentResponseModel | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; type: 'complete' | 'cancel' | 'accept' | null; appointmentId: string | null }>({ isOpen: false, type: null, appointmentId: null });
  
  const { user, customerData } = useAuthStore();

  useEffect(() => {
    if (user) {
      fetchJobs();
    }
  }, [user]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyJobs();
      const sorted = [...data].sort(
        (a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime()
      );
      setJobs(sorted);
    } catch (error: unknown) {
      console.error("Error fetching jobs:", error);
      
      // Check if it's a 404 or permission error (deactivated technician)
      if (error instanceof Error && 'response' in error) {
        const axiosError = error as { response?: { status: number; data?: { message: string } } };
        if (axiosError.response?.status === 404) {
          const errorMsg = axiosError.response?.data?.message || "Technician not found or you don't have permission to view these jobs";
          setError(errorMsg);
          setJobs([]);
          return;
        }
        if (axiosError.response?.status === 403) {
          setError("You don't have permission to view jobs. Please ensure you're logged in as a technician.");
          setJobs([]);
          return;
        }
      }
      
      setToast({
        message: "Failed to fetch jobs",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreated = () => {
    setShowAddModal(false);
    setEditingAppointment(null);
    fetchJobs();
    setToast({ 
      message: editingAppointment 
        ? t('pages.appointments.appointmentUpdated') 
        : t('pages.appointments.appointmentCreated'), 
      type: "success" 
    });
  };

  const handleCompleteJob = (appointmentId: string) => {
    setConfirmModal({ isOpen: true, type: 'complete', appointmentId });
  };

  const handleCancelJob = (appointmentId: string) => {
    setConfirmModal({ isOpen: true, type: 'cancel', appointmentId });
  };

  const handleConfirmAction = async () => {
    if (!confirmModal.appointmentId) return;

    try {
      if (confirmModal.type === 'accept') {
        await patchAppointmentStatus(confirmModal.appointmentId, { status: "SCHEDULED" });
        fetchJobs();
        setToast({ message: t('pages.jobs.jobAccepted'), type: "success" });
      } else if (confirmModal.type === 'complete') {
        await patchAppointmentStatus(confirmModal.appointmentId, { status: "COMPLETED" });
        fetchJobs();
        setToast({ message: t('pages.jobs.jobCompleted'), type: "success" });
      } else if (confirmModal.type === 'cancel') {
        await patchAppointmentStatus(confirmModal.appointmentId, { status: "CANCELLED" });
        fetchJobs();
        setToast({ message: t('pages.appointments.appointmentCancelled'), type: "success" });
      }
      setConfirmModal({ isOpen: false, type: null, appointmentId: null });
    } catch (error: unknown) {
      console.error("Error updating job:", error);
      
      // Extract error message for user
      let errorMessage = confirmModal.type === 'complete' 
        ? t('pages.jobs.errorCompleting')
        : t('pages.appointments.errorCancelling');
      
      if (typeof error === "object" && error && "response" in error) {
        const resp = (error as { response?: { data?: unknown } }).response;
        if (resp?.data) {
          if (typeof resp.data === "string") {
            errorMessage = resp.data;
          } else if (typeof resp.data === "object") {
            const data = resp.data as Record<string, unknown>;
            errorMessage = (data.message as string) || (data.error as string) || errorMessage;
          }
        }
      }
      
      setToast({ message: errorMessage, type: "error" });
      setConfirmModal({ isOpen: false, type: null, appointmentId: null });
    }
  };

  const handleEditJob = (job: AppointmentResponseModel) => {
    setEditingAppointment(job);
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
  
    // No formatting for start/end time, display raw string as in appointment page

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
    <div className="jobs-page-light">
      <div className="jobs-header">
        <h1 className="jobs-title-light">{t('pages.jobs.myJobs')}</h1>
        {customerData?.firstName && customerData?.lastName && (
          <p className="user-name-display">{t('common.welcome')}, {customerData.firstName} {customerData.lastName}</p>
        )}
        <p className="jobs-subtitle">{t('pages.jobs.yourAssignedJobs')}</p>
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
      ) : jobs.length === 0 ? (
        <div className="empty-state">
          <h3>{t('pages.jobs.noJobsAssigned')}</h3>
          <p>{t('pages.jobs.noJobsScheduled')}</p>
        </div>
      ) : (
        <div className="jobs-grid">
          {jobs.map((job) => (
            <div key={job.appointmentId} className="job-card">
              {/* Status Badge */}
              <div className={`status-badge ${getStatusBadge(job.status)}`}>
                {job.status}
              </div>

              {/* Job Header */}
              <div className="job-header-section">
                <h3 className="job-name">{job.jobName}</h3>
                <span className="job-type">{job.jobType}</span>
              </div>

              {/* Date & Time */}
              <div className="job-info-row">
                <Clock size={18} />
                <span>
                  {formatDate(job.appointmentDate)}
                  {job.appointmentStartTime && job.appointmentEndTime && (
                    <>
                      {" | "}
                      <strong>Start:</strong> {job.appointmentStartTime}
                      {" | "}
                      <strong>End:</strong> {job.appointmentEndTime}
                    </>
                  )}
                </span>
              </div>

              {/* Customer Info */}
              <div className="job-info-row">
                <User size={18} />
                <span>
                  {t('pages.jobs.customer')}: {job.customerFirstName} {job.customerLastName}
                </span>
              </div>

              {/* Customer Phone */}
              {job.customerPhoneNumbers.length > 0 && (
                <div className="job-info-row">
                  <Phone size={18} />
                  <span>{job.customerPhoneNumbers[0].number}</span>
                </div>
              )}

              {/* Cellar */}
              <div className="job-info-row">
                <Wrench size={18} />
                <span>{t('pages.jobs.cellar')}: {job.cellarName}</span>
              </div>

              {/* Address */}
              <div className="job-info-row">
                <MapPin size={18} />
                <span>
                  {job.appointmentAddress.streetAddress}, {job.appointmentAddress.city}
                </span>
              </div>

              {/* Hourly Rate */}
              <div className="job-info-row highlight-rate">
                <DollarSign size={18} />
                <span>${job.hourlyRate.toFixed(2)}{t('pages.jobs.hour')}</span>
              </div>

              {/* Description */}
              <div className="job-description">
                <AlertCircle size={16} />
                <p>{job.description}</p>
              </div>
              {/* Action Buttons */}
              <div className="job-actions">
                {job.status === "SCHEDULED" && (
                  <>
                    <button
                      className="btn-edit"
                      onClick={() => handleEditJob(job)}
                      title={t('pages.jobs.editJob')}
                    >
                      <Edit size={16} />
                      {t('common.edit')}
                    </button>
                    <button
                      className="btn-complete"
                      onClick={() => handleCompleteJob(job.appointmentId)}
                      title={t('pages.jobs.markComplete')}
                    >
                      <CheckCircle size={16} />
                      {t('pages.jobs.markComplete')}
                    </button>
                    <button
                      className="btn-cancel"
                      onClick={() => handleCancelJob(job.appointmentId)}
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
                onClick={() => setSelectedJob(job)}
              >
                {t('pages.jobs.viewFullDetails')}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedJob && (
        <div className="modal-overlay-light" onClick={() => setSelectedJob(null)}>
          <div className="modal-container-light" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-light">
              <h2>{t('pages.jobs.jobDetails')}</h2>
              <button className="modal-close-light" onClick={() => setSelectedJob(null)}>
                &#10005;
              </button>
            </div>

            <div className="modal-content-light">
              <div className="detail-section">
                <h3>{t('pages.jobs.serviceInformation')}</h3>
                <p><strong>{t('pages.jobs.job')}:</strong> {selectedJob.jobName}</p>
                <p><strong>{t('pages.jobs.type')}:</strong> {selectedJob.jobType}</p>
                <p><strong>{t('pages.jobs.rate')}:</strong> ${selectedJob.hourlyRate.toFixed(2)}/hour</p>
                <p><strong>{t('pages.jobs.status')}:</strong> <span className={`modal-status-badge ${getStatusBadge(selectedJob.status)}`}>{selectedJob.status}</span></p>
              </div>

              <div className="detail-section">
                <h3>{t('pages.jobs.scheduledTime')}</h3>
                <p>
                  {formatDate(selectedJob.appointmentDate)}
                  {selectedJob.appointmentStartTime && selectedJob.appointmentEndTime && (
                    <>
                      <br />
                      <strong>{t('pages.jobs.start')}:</strong> {selectedJob.appointmentStartTime}
                      {" | "}
                      <strong>{t('pages.jobs.end')}:</strong> {selectedJob.appointmentEndTime}
                    </>
                  )}
                </p>
              </div>

              <div className="detail-section customer-highlight">
                <h3>{t('pages.jobs.customerInformation')}</h3>
                <p><strong>{t('pages.jobs.name')}:</strong> {selectedJob.customerFirstName} {selectedJob.customerLastName}</p>
                {selectedJob.customerPhoneNumbers.map((phone, idx) => (
                  <p key={idx}><strong>{phone.type}:</strong> {phone.number}</p>
                ))}
              </div>

              <div className="detail-section">
                <h3>{t('pages.jobs.cellar')}</h3>
                <p>{selectedJob.cellarName}</p>
              </div>

              <div className="detail-section">
                <h3>{t('pages.jobs.serviceLocation')}</h3>
                <p>{selectedJob.appointmentAddress.streetAddress}</p>
                <p>{selectedJob.appointmentAddress.city}, {selectedJob.appointmentAddress.province}</p>
                <p>{selectedJob.appointmentAddress.country} {selectedJob.appointmentAddress.postalCode}</p>
              </div>

              <div className="detail-section">
                <h3>{t('pages.jobs.workDescription')}</h3>
                <p>{selectedJob.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <AddAppointmentModal
          mode="technician"
          onClose={() => {
            setShowAddModal(false);
            setEditingAppointment(null);
          }}
          onCreated={handleCreated}
          editAppointment={editingAppointment || undefined}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.type === 'complete' ? t('pages.jobs.confirmCompleteTitle') : t('pages.appointments.confirmCancelTitle')}
        message={confirmModal.type === 'complete' ? t('pages.jobs.confirmComplete') : t('pages.appointments.confirmCancel')}
        confirmText={confirmModal.type === 'complete' ? t('pages.jobs.markComplete') : t('common.cancel')}
        cancelText={t('common.goBack')}
        isDanger={confirmModal.type === 'cancel'}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmModal({ isOpen: false, type: null, appointmentId: null })}
      />
    </div>
  );
}
