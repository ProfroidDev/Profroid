import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getMyJobs } from '../../features/appointment/api/getMyJobs';
import type { AppointmentResponseModel } from '../../features/appointment/models/AppointmentResponseModel';
import AddAppointmentModal from '../../features/appointment/components/AddAppointmentModal';
import { patchAppointmentStatus } from '../../features/appointment/api/patchAppointmentStatus';
import Toast from '../../shared/components/Toast';
import useAuthStore from '../../features/authentication/store/authStore';
import ConfirmationModal from '../../components/ConfirmationModal';
import {
  MapPin,
  Clock,
  User,
  Wrench,
  DollarSign,
  Phone,
  AlertCircle,
  Edit,
  CheckCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  Calendar,
  FileText,
  Download,
} from 'lucide-react';
import './MyJobsPage.css';
import ReportFormModal from '../../features/report/components/ReportFormModal';
import ViewReportModal from '../../features/report/components/ViewReportModal';
import { getReportByAppointmentId } from '../../features/report/api/getReportByAppointmentId';
import { exportReportPdf } from '../../features/report/api/exportReportPdf';
import type { ReportResponseModel } from '../../features/report/models/ReportResponseModel';
import { getCellars } from '../../features/cellar/api/getAllCellars';
import type { CellarResponseModel } from '../../features/cellar/models/CellarResponseModel';
import {
  formatCurrencyLocalized,
  formatDateTimeLocalized,
  formatTimeLocalized,
} from '../../utils/localeFormat';

export default function MyJobsPage(): React.ReactElement {
  const { t, i18n } = useTranslation();

  // Language detection helper
  const isFrench = i18n.language === 'fr';

  // Helper function to get localized job name
  const getJobName = (job: AppointmentResponseModel): string => {
    if (isFrench && job.jobNameFr) {
      return job.jobNameFr;
    }
    return job.jobName;
  };

  // Helper function to get localized job type
  const getJobType = (job: AppointmentResponseModel): string => {
    const typeMap: Record<string, string> = {
      QUOTATION: isFrench ? t('pages.services.quotation') : 'Quotation',
      INSTALLATION: isFrench ? t('pages.services.installation') : 'Installation',
      REPARATION: isFrench ? t('pages.services.reparation') : 'Reparation',
      MAINTENANCE: isFrench ? t('pages.services.maintenance') : 'Maintenance',
    };
    return typeMap[job.jobType] || job.jobType;
  };

  const [jobs, setJobs] = useState<AppointmentResponseModel[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedJob, setSelectedJob] = useState<AppointmentResponseModel | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingAppointment, setEditingAppointment] = useState<AppointmentResponseModel | null>(
    null
  );
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'complete' | 'cancel' | 'accept' | null;
    appointmentId: string | null;
  }>({ isOpen: false, type: null, appointmentId: null });
  const [cellars, setCellars] = useState<CellarResponseModel[] | null>(null);
  const [matchedCellar, setMatchedCellar] = useState<CellarResponseModel | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 6;
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedAppointmentForReport, setSelectedAppointmentForReport] =
    useState<AppointmentResponseModel | null>(null);
  const [existingReport, setExistingReport] = useState<ReportResponseModel | null>(null);
  const [reportCheckLoading, setReportCheckLoading] = useState<string | null>(null);
  const [jobReports, setJobReports] = useState<Map<string, ReportResponseModel>>(new Map());
  const [showViewReportModal, setShowViewReportModal] = useState(false);
  const [reportToView, setReportToView] = useState<ReportResponseModel | null>(null);

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

      // Check for existing reports for completed jobs
      const reportMap = new Map<string, ReportResponseModel>();
      const completedJobs = sorted.filter((job) => job.status === 'COMPLETED');

      await Promise.all(
        completedJobs.map(async (job) => {
          try {
            const report = await getReportByAppointmentId(job.appointmentId);
            if (report) {
              reportMap.set(job.appointmentId, report);
            }
          } catch {
            // Report doesn't exist yet, which is fine
            console.debug(`No report found for appointment ${job.appointmentId}`);
          }
        })
      );

      setJobReports(reportMap);

      const newTotalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
      setCurrentPage((prev) => Math.min(prev, newTotalPages));
    } catch (error: unknown) {
      console.error('Error fetching jobs:', error);

      // Check if it's a 404 or permission error (deactivated technician)
      if (error instanceof Error && 'response' in error) {
        const axiosError = error as { response?: { status: number; data?: { message: string } } };
        if (axiosError.response?.status === 404) {
          const errorMsg =
            axiosError.response?.data?.message ||
            "Technician not found or you don't have permission to view these jobs";
          setError(errorMsg);
          setJobs([]);
          return;
        }
        if (axiosError.response?.status === 403) {
          setError(
            "You don't have permission to view jobs. Please ensure you're logged in as a technician."
          );
          setJobs([]);
          return;
        }
      }

      setToast({
        message: 'Failed to fetch jobs',
        type: 'error',
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
      type: 'success',
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
        await patchAppointmentStatus(confirmModal.appointmentId, { status: 'SCHEDULED' });
        fetchJobs();
        setToast({ message: t('pages.jobs.jobAccepted'), type: 'success' });
      } else if (confirmModal.type === 'complete') {
        await patchAppointmentStatus(confirmModal.appointmentId, { status: 'COMPLETED' });
        fetchJobs();
        setToast({ message: t('pages.jobs.jobCompleted'), type: 'success' });
      } else if (confirmModal.type === 'cancel') {
        await patchAppointmentStatus(confirmModal.appointmentId, { status: 'CANCELLED' });
        fetchJobs();
        setToast({ message: t('pages.appointments.appointmentCancelled'), type: 'success' });
      }
      setConfirmModal({ isOpen: false, type: null, appointmentId: null });
    } catch (error: unknown) {
      console.error('Error updating job:', error);

      // Extract error message for user
      let errorMessage =
        confirmModal.type === 'complete'
          ? t('pages.jobs.errorCompleting')
          : t('pages.appointments.errorCancelling');

      if (typeof error === 'object' && error && 'response' in error) {
        const resp = (error as { response?: { data?: unknown } }).response;
        if (resp?.data) {
          if (typeof resp.data === 'string') {
            errorMessage = resp.data;
          } else if (typeof resp.data === 'object') {
            const data = resp.data as Record<string, unknown>;
            errorMessage = (data.message as string) || (data.error as string) || errorMessage;
          }
        }
      }

      setToast({ message: errorMessage, type: 'error' });
      setConfirmModal({ isOpen: false, type: null, appointmentId: null });
    }
  };

  const handleEditJob = (job: AppointmentResponseModel) => {
    setEditingAppointment(job);
    setShowAddModal(true);
  };

  const handleOpenReportModal = async (job: AppointmentResponseModel) => {
    setSelectedAppointmentForReport(job);
    setReportCheckLoading(job.appointmentId);

    try {
      // Check if report already exists
      const report = await getReportByAppointmentId(job.appointmentId);
      setExistingReport(report);
    } catch (error) {
      console.error('Error checking for existing report:', error);
      setExistingReport(null);
    } finally {
      setReportCheckLoading(null);
      setShowReportModal(true);
    }
  };

  const handleReportSuccess = (message: string) => {
    setShowReportModal(false);
    setSelectedAppointmentForReport(null);
    setExistingReport(null);
    setToast({ message, type: 'success' });
    fetchJobs(); // Refresh the jobs list
  };

  const handleReportError = (message: string) => {
    setToast({ message, type: 'error' });
  };

  const handleViewReport = (appointmentId: string) => {
    const report = jobReports.get(appointmentId);
    if (report) {
      setReportToView(report);
      setShowViewReportModal(true);
    }
  };

  const formatDate = (dateString: string): string => {
    return formatDateTimeLocalized(dateString, i18n.language, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // No formatting for start/end time, display raw string as in appointment page

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

  // Load cellar info when a job is selected
  useEffect(() => {
    const loadCellar = async () => {
      if (!selectedJob) {
        setMatchedCellar(null);
        return;
      }

      try {
        if (!cellars) {
          const all = await getCellars();
          setCellars(all);
          const match =
            all.find(
              (c) =>
                c.ownerCustomerId === selectedJob.customerId && c.name === selectedJob.cellarName
            ) || null;
          setMatchedCellar(match);
        } else {
          const match =
            cellars.find(
              (c) =>
                c.ownerCustomerId === selectedJob.customerId && c.name === selectedJob.cellarName
            ) || null;
          setMatchedCellar(match);
        }
      } catch (e) {
        console.warn('Unable to fetch cellar details', e);
        setMatchedCellar(null);
      }
    };

    loadCellar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedJob]);

  const cellarDimensions = useMemo(() => {
    if (!matchedCellar) return null;
    return `${matchedCellar.height}cm x ${matchedCellar.width}cm x ${matchedCellar.depth}cm`;
  }, [matchedCellar]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((a) => {
      const statusMatch = statusFilters.length === 0 ? true : statusFilters.includes(a.status);
      const dateOnly = new Date(a.appointmentDate).toISOString().split('T')[0];
      const startOk = startDateFilter ? dateOnly >= startDateFilter : true;
      const endOk = endDateFilter ? dateOnly <= endDateFilter : true;
      return statusMatch && startOk && endOk;
    });
  }, [jobs, statusFilters, startDateFilter, endDateFilter]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredJobs.length / pageSize));
  }, [filteredJobs.length]);

  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredJobs.slice(start, start + pageSize);
  }, [filteredJobs, currentPage]);

  const goPrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  return (
    <div className="jobs-page-light">
      <div className="jobs-header">
        <h1 className="jobs-title-light">{t('pages.jobs.myJobs')}</h1>
        {customerData?.firstName && customerData?.lastName && (
          <p className="user-name-display">
            {t('common.welcome')}, {customerData.firstName} {customerData.lastName}
          </p>
        )}
        <p className="jobs-subtitle">{t('pages.jobs.yourAssignedJobs')}</p>
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
              <span>{t('pages.jobs.status') || t('pages.appointments.status')}</span>
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
                {t('pages.jobs.statusScheduled') || t('pages.appointments.statusScheduled')}
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
                {t('pages.jobs.statusCompleted') || t('pages.appointments.statusCompleted')}
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
                {t('pages.jobs.statusCancelled') || t('pages.appointments.statusCancelled')}
              </button>
            </div>
          </div>

          <div className="filters-card">
            <div className="filters-card-header">
              <Calendar size={18} />
              <span>{t('pages.jobs.scheduledTime') || t('pages.appointments.date')}</span>
            </div>
            <div className="date-range">
              <label className="filter-item">
                {t('pages.jobs.startDate') || t('pages.appointments.startDate')}
                <input
                  type="date"
                  value={startDateFilter}
                  max={endDateFilter}
                  onChange={(e) => {
                    const newStartDate = e.target.value;
                    setStartDateFilter(newStartDate);
                    // If new start date is after end date, adjust end date
                    if (endDateFilter && newStartDate > endDateFilter) {
                      setEndDateFilter(newStartDate);
                    }
                    setCurrentPage(1);
                  }}
                  className="filter-input"
                />
              </label>
              <span className="date-separator">—</span>
              <label className="filter-item">
                {t('pages.jobs.endDate') || t('pages.appointments.endDate')}
                <input
                  type="date"
                  value={endDateFilter}
                  min={startDateFilter}
                  onChange={(e) => {
                    const newEndDate = e.target.value;
                    // Prevent end date from being earlier than start date
                    if (startDateFilter && newEndDate < startDateFilter) {
                      setEndDateFilter(startDateFilter);
                    } else {
                      setEndDateFilter(newEndDate);
                    }
                    setCurrentPage(1);
                  }}
                  className="filter-input"
                />
              </label>
            </div>
          </div>

          {startDateFilter || endDateFilter || statusFilters.length > 0 ? (
            <button
              className="btn-secondary"
              onClick={() => {
                setStatusFilters([]);
                setStartDateFilter('');
                setEndDateFilter('');
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
      ) : jobs.length === 0 ? (
        <div className="empty-state">
          <h3>{t('pages.jobs.noJobsAssigned')}</h3>
          <p>{t('pages.jobs.noJobsScheduled')}</p>
        </div>
      ) : (
        <>
          <div className="jobs-grid">
            {paginatedJobs.map((job) => (
              <div key={job.appointmentId} className="job-card">
                {/* Status Badge */}
                <div className={`status-badge ${getStatusBadge(job.status)}`}>
                  {getStatusLabel(job.status)}
                </div>

                {/* Job Header */}
                <div className="job-header-section">
                  <h3 className="job-name">{getJobName(job)}</h3>
                  <span className="job-type">{getJobType(job)}</span>
                </div>

                {/* Date & Time */}
                <div className="job-info-row">
                  <Clock size={18} />
                  <span>
                    {formatDate(job.appointmentDate)}
                    {job.appointmentStartTime && job.appointmentEndTime && (
                      <>
                        {' | '}
                        <strong>{isFrench ? 'Début:' : 'Start:'}</strong>{' '}
                        {formatTimeLocalized(job.appointmentStartTime, i18n.language)}
                        {' | '}
                        <strong>{isFrench ? 'Fin:' : 'End:'}</strong>{' '}
                        {formatTimeLocalized(job.appointmentEndTime, i18n.language)}
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
                  <span>
                    {t('pages.jobs.cellar')}: {job.cellarName}
                  </span>
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
                  <span>
                    {formatCurrencyLocalized(job.hourlyRate, i18n.language, 'CAD')}
                    {t('pages.jobs.hour')}
                  </span>
                </div>

                {/* Description */}
                <div className="job-description">
                  <AlertCircle size={16} />
                  <p>{job.description}</p>
                </div>
                {/* Action Buttons */}
                <div className="job-actions">
                  {job.status === 'SCHEDULED' && (
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
                  {job.status === 'COMPLETED' && (
                    <>
                      <button
                        className="btn-report"
                        onClick={() => handleOpenReportModal(job)}
                        disabled={reportCheckLoading === job.appointmentId}
                        title="Create/Edit Work Report"
                      >
                        <FileText size={16} />
                        {reportCheckLoading === job.appointmentId
                          ? isFrench
                            ? 'Chargement...'
                            : 'Loading...'
                          : jobReports.has(job.appointmentId)
                            ? isFrench
                              ? 'Modifier le Rapport'
                              : 'Edit Report'
                            : isFrench
                              ? 'Créer un Rapport'
                              : 'Create Report'}
                      </button>
                      {jobReports.has(job.appointmentId) && (
                        <button
                          className="btn-view-report"
                          onClick={() => handleViewReport(job.appointmentId)}
                          title={isFrench ? 'Voir les Détails du Rapport' : 'View Report Details'}
                        >
                          <FileText size={16} />
                          {isFrench ? 'Voir le Rapport' : 'View Report'}
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* View Details & Download Report Button */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-view-details" onClick={() => setSelectedJob(job)}>
                    {t('pages.jobs.viewFullDetails')}
                  </button>
                  {job.status === 'COMPLETED' && jobReports.has(job.appointmentId) && (
                    <button
                      className="btn-view-details"
                      onClick={async () => {
                        try {
                          const reportId = jobReports.get(job.appointmentId)?.reportId;
                          if (!reportId) return;
                          const language = i18n.language === 'fr' ? 'fr' : 'en';
                          const blob = await exportReportPdf(reportId, language);
                          const url = window.URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = `report_${reportId}.pdf`;
                          document.body.appendChild(link);
                          link.click();
                          link.remove();
                          window.URL.revokeObjectURL(url);
                          setToast({ message: 'Report PDF downloaded', type: 'success' });
                        } catch (err) {
                          console.error('Download PDF failed', err);
                          setToast({ message: 'Failed to download PDF', type: 'error' });
                        }
                      }}
                      title="Download Report PDF"
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Download size={16} />
                      {t('common.download')}
                    </button>
                  )}
                </div>
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
                <p>
                  <strong>{t('pages.jobs.job')} (English):</strong> {selectedJob.jobName}
                </p>
                {isFrench && selectedJob.jobNameFr && (
                  <p>
                    <strong>{t('pages.jobs.job')} (Français):</strong> {selectedJob.jobNameFr}
                  </p>
                )}
                <p>
                  <strong>{t('pages.jobs.type')}:</strong> {getJobType(selectedJob)}
                </p>
                <p>
                  <strong>{t('pages.jobs.rate')}:</strong>{' '}
                  {formatCurrencyLocalized(selectedJob.hourlyRate, i18n.language, 'CAD')}/hour
                </p>
                <p>
                  <strong>{t('pages.jobs.status')}:</strong>{' '}
                  <span className={`modal-status-badge ${getStatusBadge(selectedJob.status)}`}>
                    {getStatusLabel(selectedJob.status)}
                  </span>
                </p>
              </div>

              <div className="detail-section">
                <h3>{t('pages.jobs.scheduledTime')}</h3>
                <p>
                  {formatDate(selectedJob.appointmentDate)}
                  {selectedJob.appointmentStartTime && selectedJob.appointmentEndTime && (
                    <>
                      <br />
                      <strong>{t('pages.jobs.start')}:</strong>{' '}
                      {formatTimeLocalized(selectedJob.appointmentStartTime, i18n.language)}
                      {' | '}
                      <strong>{t('pages.jobs.end')}:</strong>{' '}
                      {formatTimeLocalized(selectedJob.appointmentEndTime, i18n.language)}
                    </>
                  )}
                </p>
              </div>

              <div className="detail-section customer-highlight">
                <h3>{t('pages.jobs.customerInformation')}</h3>
                <p>
                  <strong>{t('pages.jobs.name')}:</strong> {selectedJob.customerFirstName}{' '}
                  {selectedJob.customerLastName}
                </p>
                {selectedJob.customerPhoneNumbers.map((phone, idx) => (
                  <p key={idx}>
                    <strong>{phone.type}:</strong> {phone.number}
                  </p>
                ))}
              </div>

              <div className="detail-section">
                <h3>{t('pages.jobs.cellar')}</h3>
                <p>
                  <strong>{t('pages.jobs.name')}:</strong> {selectedJob.cellarName}
                </p>
                {matchedCellar ? (
                  <>
                    <p>
                      <strong>{t('pages.jobs.type')}:</strong> {matchedCellar.cellarType}
                    </p>
                    <p>
                      <strong>{t('pages.jobs.dimensions')}:</strong> {cellarDimensions}
                    </p>
                    <p>
                      <strong>{t('pages.jobs.capacity')}:</strong> {matchedCellar.bottleCapacity}{' '}
                      bottles
                    </p>
                    <p>
                      <strong>{t('pages.jobs.features')}:</strong>{' '}
                      {[
                        matchedCellar.hasCoolingSystem ? t('pages.appointments.cooling') : null,
                        matchedCellar.hasHumidityControl
                          ? t('pages.appointments.humidityControl')
                          : null,
                        matchedCellar.hasAutoRegulation
                          ? t('pages.appointments.autoRegulation')
                          : null,
                      ]
                        .filter(Boolean)
                        .join(', ') || t('common.none')}
                    </p>
                  </>
                ) : null}
              </div>

              <div className="detail-section">
                <h3>{t('pages.jobs.serviceLocation')}</h3>
                <p>{selectedJob.appointmentAddress.streetAddress}</p>
                <p>
                  {selectedJob.appointmentAddress.city}, {selectedJob.appointmentAddress.province}
                </p>
                <p>
                  {selectedJob.appointmentAddress.country}{' '}
                  {selectedJob.appointmentAddress.postalCode}
                </p>
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

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={
          confirmModal.type === 'complete'
            ? t('pages.jobs.confirmCompleteTitle')
            : t('pages.appointments.confirmCancelTitle')
        }
        message={
          confirmModal.type === 'complete'
            ? t('pages.jobs.confirmComplete')
            : t('pages.appointments.confirmCancel')
        }
        confirmText={
          confirmModal.type === 'complete' ? t('pages.jobs.markComplete') : t('common.cancel')
        }
        cancelText={t('common.goBack')}
        isDanger={confirmModal.type === 'cancel'}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmModal({ isOpen: false, type: null, appointmentId: null })}
      />

      {showReportModal && selectedAppointmentForReport && (
        <ReportFormModal
          isOpen={showReportModal}
          onClose={() => {
            setShowReportModal(false);
            setSelectedAppointmentForReport(null);
            setExistingReport(null);
          }}
          appointment={selectedAppointmentForReport}
          existingReport={existingReport}
          onSuccess={handleReportSuccess}
          onError={handleReportError}
        />
      )}

      {showViewReportModal && reportToView && (
        <ViewReportModal
          isOpen={showViewReportModal}
          onClose={() => {
            setShowViewReportModal(false);
            setReportToView(null);
          }}
          report={reportToView}
        />
      )}
    </div>
  );
}
