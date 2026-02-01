import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { sanitizeInput } from '../../utils/sanitizer';
import { getAllAppointments } from '../../features/appointment/api/getAllAppointments';
import type { AppointmentResponseModel } from '../../features/appointment/models/AppointmentResponseModel';
import Toast from '../../shared/components/Toast';
import {
  MapPin,
  Clock,
  User,
  Wrench,
  DollarSign,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Calendar,
  Search,
} from 'lucide-react';
import './AdminAppointmentsPage.css';
import { getEmployee } from '../../features/employee/api/getEmployeeById';
import type { EmployeeResponseModel } from '../../features/employee/models/EmployeeResponseModel';
import { getCellars } from '../../features/cellar/api/getAllCellars';
import type { CellarResponseModel } from '../../features/cellar/models/CellarResponseModel';

export default function AdminAppointmentsPage(): React.ReactElement {
  const { t, i18n } = useTranslation();
  const [appointments, setAppointments] = useState<AppointmentResponseModel[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentResponseModel | null>(
    null
  );
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [technicianDetails, setTechnicianDetails] = useState<EmployeeResponseModel | null>(null);
  const [cellars, setCellars] = useState<CellarResponseModel[] | null>(null);
  const [matchedCellar, setMatchedCellar] = useState<CellarResponseModel | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 6;
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  const [technicianSearchTerm, setTechnicianSearchTerm] = useState<string>('');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllAppointments();
      const sorted = [...data].sort(
        (a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
      );
      setAppointments(sorted);
      const newTotalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
      setCurrentPage((prev) => Math.min(prev, newTotalPages));
    } catch {
      setToast({
        message: 'Failed to fetch appointments',
        type: 'error',
      });
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';
    return date.toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string): string => {
    switch (status) {
      case 'SCHEDULED':
        return 'status-scheduled';
      case 'COMPLETED':
        return 'status-completed';
      case 'CANCELLED':
        return 'status-cancelled';
      default:
        return '';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'SCHEDULED':
        return t('pages.appointments.statusScheduled');
      case 'COMPLETED':
        return t('pages.appointments.statusCompleted');
      case 'CANCELLED':
        return t('pages.appointments.statusCancelled');
      default:
        return status;
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
      } catch {
        setTechnicianDetails(null);
      }

      // Fetch cellars and find the matching one by owner + name
      try {
        if (!cellars) {
          const all = await getCellars();
          setCellars(all);
          const match =
            all.find(
              (c) =>
                c.ownerCustomerId === selectedAppointment.customerId &&
                c.name === selectedAppointment.cellarName
            ) || null;
          setMatchedCellar(match);
        } else {
          const match =
            cellars.find(
              (c) =>
                c.ownerCustomerId === selectedAppointment.customerId &&
                c.name === selectedAppointment.cellarName
            ) || null;
          setMatchedCellar(match);
        }
      } catch {
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
      const dateOnly = new Date(a.appointmentDate).toISOString().split('T')[0];
      const startOk = startDateFilter ? dateOnly >= startDateFilter : true;
      const endOk = endDateFilter ? dateOnly <= endDateFilter : true;

      // Technician search filter
      const technicianFullName = `${a.technicianFirstName} ${a.technicianLastName}`.toLowerCase();
      const searchTerm = technicianSearchTerm.toLowerCase().trim();
      const technicianMatch = searchTerm ? technicianFullName.includes(searchTerm) : true;

      return statusMatch && startOk && endOk && technicianMatch;
    });
  }, [appointments, statusFilters, startDateFilter, endDateFilter, technicianSearchTerm]);

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
        <h1 className="appointments-title-light">{t('pages.appointments.allAppointments')}</h1>
        <p className="appointments-subtitle">{t('pages.appointments.manageAllAppointments')}</p>

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
                    if (next.has('SCHEDULED')) {
                      next.delete('SCHEDULED');
                    } else {
                      next.add('SCHEDULED');
                    }
                    setCurrentPage(1);
                    return Array.from(next);
                  });
                }}
              >
                {t('pages.appointments.statusScheduled')}
              </button>
              <button
                type="button"
                className={`chip ${statusFilters.includes('COMPLETED') ? 'active' : ''}`}
                onClick={() => {
                  setStatusFilters((prev) => {
                    const next = new Set(prev);
                    if (next.has('COMPLETED')) {
                      next.delete('COMPLETED');
                    } else {
                      next.add('COMPLETED');
                    }
                    setCurrentPage(1);
                    return Array.from(next);
                  });
                }}
              >
                {t('pages.appointments.statusCompleted')}
              </button>
              <button
                type="button"
                className={`chip ${statusFilters.includes('CANCELLED') ? 'active' : ''}`}
                onClick={() => {
                  setStatusFilters((prev) => {
                    const next = new Set(prev);
                    if (next.has('CANCELLED')) {
                      next.delete('CANCELLED');
                    } else {
                      next.add('CANCELLED');
                    }
                    setCurrentPage(1);
                    return Array.from(next);
                  });
                }}
              >
                {t('pages.appointments.statusCancelled')}
              </button>
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setStartDateFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="filter-input"
                />
              </label>
              <span className="date-separator">—</span>
              <label className="filter-item">
                {t('pages.appointments.endDate')}
                <input
                  type="date"
                  value={endDateFilter}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setEndDateFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="filter-input"
                />
              </label>
            </div>
          </div>

          <div className="filters-card">
            <div className="filters-card-header">
              <span>{t('pages.appointments.technician')}</span>
            </div>
            <div className="search-input-group">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder={t('pages.appointments.searchTechnician')}
                value={technicianSearchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setTechnicianSearchTerm(sanitizeInput(e.target.value));
                  setCurrentPage(1);
                }}
                className="search-input"
              />
            </div>
          </div>

          {startDateFilter || endDateFilter || statusFilters.length > 0 || technicianSearchTerm ? (
            <button
              className="btn-secondary"
              onClick={() => {
                setStatusFilters([]);
                setStartDateFilter('');
                setEndDateFilter('');
                setTechnicianSearchTerm('');
                setCurrentPage(1);
              }}
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
                  {getStatusLabel(appointment.status)}
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
                        {' | '}
                        <strong>{t('pages.appointments.start')}:</strong>{' '}
                        {appointment.appointmentStartTime}
                        {' | '}
                        <strong>{t('pages.appointments.end')}:</strong>{' '}
                        {appointment.appointmentEndTime}
                      </>
                    )}
                  </span>
                </div>

                {/* Technician */}
                <div className="appointment-info-row">
                  <User size={18} />
                  <span>
                    {t('pages.appointments.technician')}: {appointment.technicianFirstName}{' '}
                    {appointment.technicianLastName}
                  </span>
                </div>

                {/* Customer */}
                <div className="appointment-info-row">
                  <User size={18} />
                  <span>
                    {t('pages.appointments.customer')}: {appointment.customerFirstName}{' '}
                    {appointment.customerLastName}
                  </span>
                </div>

                {/* Cellar */}
                <div className="appointment-info-row">
                  <Wrench size={18} />
                  <span>
                    {t('pages.appointments.cellar')}: {appointment.cellarName}
                  </span>
                </div>

                {/* Address */}
                <div className="appointment-info-row">
                  <MapPin size={18} />
                  <span>
                    {appointment.appointmentAddress.streetAddress},{' '}
                    {appointment.appointmentAddress.city}
                  </span>
                </div>

                {/* Hourly Rate */}
                <div className="appointment-info-row">
                  <DollarSign size={18} />
                  <span>
                    ${appointment.hourlyRate.toFixed(2)}
                    {t('pages.appointments.hour')}
                  </span>
                </div>

                {/* Description */}
                <div className="appointment-description">
                  <AlertCircle size={16} />
                  <p>{appointment.description}</p>
                </div>

                {/* Action Buttons */}
                <div className="appointment-actions"></div>

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
                <p>
                  <strong>{t('pages.appointments.job')}:</strong> {selectedAppointment.jobName}
                </p>
                <p>
                  <strong>{t('pages.appointments.type')}:</strong> {selectedAppointment.jobType}
                </p>
                <p>
                  <strong>{t('pages.appointments.rate')}:</strong> $
                  {selectedAppointment.hourlyRate.toFixed(2)}
                  {t('pages.appointments.hour')}
                </p>
                <p>
                  <strong>{t('pages.appointments.status')}:</strong>{' '}
                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: '16px',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      display: 'inline-block',
                      marginLeft: '8px',
                    }}
                    className={getStatusBadge(selectedAppointment.status)}
                  >
                    {getStatusLabel(selectedAppointment.status)}
                  </span>
                </p>
              </div>

              <div className="detail-section">
                <h3>{t('pages.appointments.dateTime')}</h3>
                <p>
                  <strong>{t('pages.appointments.appointmentDate')}:</strong>{' '}
                  {formatDate(selectedAppointment.appointmentDate)}
                </p>
                {selectedAppointment.appointmentStartTime &&
                  selectedAppointment.appointmentEndTime && (
                    <>
                      <p>
                        <strong>{t('pages.appointments.startTime')}:</strong>{' '}
                        {selectedAppointment.appointmentStartTime}
                      </p>
                      <p>
                        <strong>{t('pages.appointments.endTime')}:</strong>{' '}
                        {selectedAppointment.appointmentEndTime}
                      </p>
                    </>
                  )}
              </div>

              <div className="detail-section">
                <h3>{t('pages.appointments.technicianInformation')}</h3>
                <p>
                  <strong>{t('pages.appointments.name')}:</strong>{' '}
                  {selectedAppointment.technicianFirstName} {selectedAppointment.technicianLastName}
                </p>
                {technicianDetails &&
                  technicianDetails.phoneNumbers &&
                  technicianDetails.phoneNumbers.length > 0 && (
                    <p>
                      <strong>{t('pages.appointments.phone')}:</strong>{' '}
                      {technicianDetails.phoneNumbers[0].number}
                    </p>
                  )}
              </div>

              <div className="detail-section">
                <h3>{t('pages.appointments.customerInformation')}</h3>
                <p>
                  <strong>{t('pages.appointments.name')}:</strong>{' '}
                  {selectedAppointment.customerFirstName} {selectedAppointment.customerLastName}
                </p>
              </div>

              <div className="detail-section">
                <h3>{t('pages.appointments.location')}</h3>
                <p>
                  <strong>{t('pages.appointments.address')}:</strong>{' '}
                  {selectedAppointment.appointmentAddress.streetAddress},{' '}
                  {selectedAppointment.appointmentAddress.city}
                </p>
                <p>
                  <strong>{t('pages.appointments.cellar')}:</strong>{' '}
                  {selectedAppointment.cellarName}
                </p>
                {matchedCellar && (
                  <p>
                    <strong>{t('pages.appointments.dimensions')}:</strong> {cellarDimensions}
                  </p>
                )}
              </div>

              <div className="detail-section">
                <h3>{t('pages.appointments.notes')}</h3>
                <p>{selectedAppointment.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
