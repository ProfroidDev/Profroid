import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getMyAppointments } from "../../features/appointment/api/getMyAppointments";
import type { AppointmentResponseModel } from "../../features/appointment/models/AppointmentResponseModel";
import AddAppointmentModal from "../../features/appointment/components/AddAppointmentModal";
import { patchAppointmentStatus } from "../../features/appointment/api/patchAppointmentStatus";
import Toast from "../../shared/components/Toast";
import useAuthStore from "../../features/authentication/store/authStore";
import ConfirmationModal from "../../components/ConfirmationModal";
import { MapPin, Clock, User, Wrench, DollarSign, AlertCircle, Edit, X, ChevronLeft, ChevronRight, Filter, Calendar } from "lucide-react";
import "./MyAppointmentsPage.css";
import { getEmployee } from "../../features/employee/api/getEmployeeById";
import type { EmployeeResponseModel } from "../../features/employee/models/EmployeeResponseModel";
import { getCellars } from "../../features/cellar/api/getAllCellars";
import type { CellarResponseModel } from "../../features/cellar/models/CellarResponseModel";

export default function MyAppointmentsPage(): React.ReactElement {
  const { t, i18n } = useTranslation();
  const [appointments, setAppointments] = useState<AppointmentResponseModel[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentResponseModel | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingAppointment, setEditingAppointment] = useState<AppointmentResponseModel | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; appointmentId: string | null }>({ isOpen: false, appointmentId: null });
  const [technicianDetails, setTechnicianDetails] = useState<EmployeeResponseModel | null>(null);
  const [cellars, setCellars] = useState<CellarResponseModel[] | null>(null);
  const [matchedCellar, setMatchedCellar] = useState<CellarResponseModel | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 6;
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [startDateFilter, setStartDateFilter] = useState<string>("");
  const [endDateFilter, setEndDateFilter] = useState<string>("");
  
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
      const sorted = [...data].sort(
        (a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime()
      );
      setAppointments(sorted);
      const newTotalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
      setCurrentPage((prev) => Math.min(prev, newTotalPages));
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

  const handleCancelAppointment = (appointmentId: string) => {
    setConfirmModal({ isOpen: true, appointmentId });
  };

  const handleConfirmCancel = async () => {
    if (!confirmModal.appointmentId) return;

    try {
      await patchAppointmentStatus(confirmModal.appointmentId, { status: "CANCELLED" });
      fetchAppointments();
      setToast({ message: t('pages.appointments.appointmentCancelled'), type: "success" });
      setConfirmModal({ isOpen: false, appointmentId: null });
    } catch (error: unknown) {
      console.error("Error cancelling appointment:", error);
      setToast({ message: t('pages.appointments.errorCancelling'), type: "error" });
      setConfirmModal({ isOpen: false, appointmentId: null });
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

  // Load technician details and cellar info when a specific appointment is selected
  useEffect(() => {
    const loadExtraDetails = async () => {
      if (!selectedAppointment) {
        setTechnicianDetails(null);
        setMatchedCellar(null);
        return;
      }

      // Fetch technician details for phone numbers
      try {
        const emp = await getEmployee(selectedAppointment.technicianId);
        setTechnicianDetails(emp);
      } catch (e) {
        console.warn("Unable to fetch technician details", e);
        setTechnicianDetails(null);
      }

      // Fetch cellars and find the matching one by owner + name
      try {
        if (!cellars) {
          const all = await getCellars();
          setCellars(all);
          const match = all.find(
            (c) => c.ownerCustomerId === selectedAppointment.customerId && c.name === selectedAppointment.cellarName
          ) || null;
          setMatchedCellar(match);
        } else {
          const match = cellars.find(
            (c) => c.ownerCustomerId === selectedAppointment.customerId && c.name === selectedAppointment.cellarName
          ) || null;
          setMatchedCellar(match);
        }
      } catch (e) {
        console.warn("Unable to fetch cellar details", e);
        setMatchedCellar(null);
      }
    };

    loadExtraDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAppointment]);

  const cellarDimensions = useMemo(() => {
    if (!matchedCellar) return null;
    return `${matchedCellar.height}cm x ${matchedCellar.width}cm x ${matchedCellar.depth}cm`;
  }, [matchedCellar]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      const statusMatch = statusFilters.length === 0 ? true : statusFilters.includes(a.status);
      const dateOnly = new Date(a.appointmentDate).toISOString().split("T")[0];
      const startOk = startDateFilter ? dateOnly >= startDateFilter : true;
      const endOk = endDateFilter ? dateOnly <= endDateFilter : true;
      return statusMatch && startOk && endOk;
    });
  }, [appointments, statusFilters, startDateFilter, endDateFilter]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredAppointments.length / pageSize));
  }, [filteredAppointments.length]);

  const paginatedAppointments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAppointments.slice(start, start + pageSize);
  }, [filteredAppointments, currentPage]);

  const goPrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

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
          {/* Filters */}
          <div className="filters-section">
            <div className="filters-card">
              <div className="filters-card-header">
                <Filter size={18} />
                <span>{t('pages.appointments.status')}</span>
              </div>
              <div className="chip-group">
                <button
                  type="button"
                  className={`chip ${statusFilters.includes('SCHEDULED') ? 'active' : ''}`}
                  onClick={() => {
                    setStatusFilters((prev) => {
                      const next = new Set(prev);
                      next.has('SCHEDULED') ? next.delete('SCHEDULED') : next.add('SCHEDULED');
                      setCurrentPage(1);
                      return Array.from(next);
                    });
                  }}
                >{t('pages.appointments.statusScheduled')}</button>
                <button
                  type="button"
                  className={`chip ${statusFilters.includes('COMPLETED') ? 'active' : ''}`}
                  onClick={() => {
                    setStatusFilters((prev) => {
                      const next = new Set(prev);
                      next.has('COMPLETED') ? next.delete('COMPLETED') : next.add('COMPLETED');
                      setCurrentPage(1);
                      return Array.from(next);
                    });
                  }}
                >{t('pages.appointments.statusCompleted')}</button>
                <button
                  type="button"
                  className={`chip ${statusFilters.includes('CANCELLED') ? 'active' : ''}`}
                  onClick={() => {
                    setStatusFilters((prev) => {
                      const next = new Set(prev);
                      next.has('CANCELLED') ? next.delete('CANCELLED') : next.add('CANCELLED');
                      setCurrentPage(1);
                      return Array.from(next);
                    });
                  }}
                >{t('pages.appointments.statusCancelled')}</button>
              </div>
            </div>

            <div className="filters-card">
              <div className="filters-card-header">
                <Calendar size={18} />
                <span>{t('pages.appointments.date')}</span>
              </div>
              <div className="date-range">
                <label className="filter-item">
                  {t('pages.appointments.startDate')}
                  <input
                    type="date"
                    value={startDateFilter}
                    onChange={(e) => { setStartDateFilter(e.target.value); setCurrentPage(1); }}
                    className="filter-input"
                  />
                </label>
                <span className="date-separator">—</span>
                <label className="filter-item">
                  {t('pages.appointments.endDate')}
                  <input
                    type="date"
                    value={endDateFilter}
                    onChange={(e) => { setEndDateFilter(e.target.value); setCurrentPage(1); }}
                    className="filter-input"
                  />
                </label>
              </div>
            </div>

            {(startDateFilter || endDateFilter || statusFilters.length > 0) ? (
              <button
                className="btn-secondary"
                onClick={() => { setStatusFilters([]); setStartDateFilter(''); setEndDateFilter(''); setCurrentPage(1); }}
              >
                {t('common.clear')}
              </button>
            ) : null}
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
        <>
        <div className="appointments-grid">
          {paginatedAppointments.map((appointment) => (
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
                {appointment.status === "SCHEDULED" && (appointment.createdByRole === "CUSTOMER" || appointment.createdByRole === null || appointment.createdByRole === undefined) && (
                  <button
                    className="btn-edit"
                    onClick={() => handleEditAppointment(appointment)}
                    title={t('pages.appointments.editAppointment')}
                  >
                    <Edit size={16} />
                    {t('common.edit')}
                  </button>
                )}
                {appointment.status === "SCHEDULED" && (
                  <button
                    className="btn-cancel"
                    onClick={() => handleCancelAppointment(appointment.appointmentId)}
                    title={t('pages.appointments.cancelAppointment')}
                  >
                    <X size={16} />
                    {t('common.cancel')}
                  </button>
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

        <div className="pagination-controls">
          <button
            className="pagination-button"
            onClick={goPrev}
            disabled={currentPage === 1}
            title="Previous"
            aria-label="Previous"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="page-indicator">
            {currentPage} / {totalPages}
          </span>
          <button
            className="pagination-button"
            onClick={goNext}
            disabled={currentPage === totalPages}
            title="Next"
            aria-label="Next"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        </>
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
                {technicianDetails?.phoneNumbers?.length ? (
                  <div>
                    {technicianDetails.phoneNumbers.map((ph, idx) => (
                      <p key={idx}><strong>{ph.type}:</strong> {ph.number}</p>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="detail-section">
                <h3>{t('pages.appointments.cellar')}</h3>
                <p><strong>{t('pages.appointments.name')}:</strong> {selectedAppointment.cellarName}</p>
                {matchedCellar ? (
                  <>
                    <p><strong>{t('pages.appointments.type')}:</strong> {matchedCellar.cellarType}</p>
                    <p><strong>{t('pages.appointments.dimensions')}:</strong> {cellarDimensions}</p>
                    <p><strong>{t('pages.appointments.capacity')}:</strong> {matchedCellar.bottleCapacity} bottles</p>
                    <p><strong>{t('pages.appointments.features')}:</strong> {[
                      matchedCellar.hasCoolingSystem ? t('pages.appointments.cooling') : null,
                      matchedCellar.hasHumidityControl ? t('pages.appointments.humidityControl') : null,
                      matchedCellar.hasAutoRegulation ? t('pages.appointments.autoRegulation') : null,
                    ].filter(Boolean).join(', ') || t('common.none')}</p>
                  </>
                ) : null}
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

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={t('pages.appointments.confirmCancelTitle')}
        message={t('pages.appointments.confirmCancel')}
        confirmText={t('common.cancel')}
        cancelText={t('common.goBack')}
        isDanger={true}
        onConfirm={handleConfirmCancel}
        onCancel={() => setConfirmModal({ isOpen: false, appointmentId: null })}
      />
    </div>
  );
}
