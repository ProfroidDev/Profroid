import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';
import { getJobs } from '../../features/jobs/api/getAllJobs';
import { getJobById } from '../../features/jobs/api/getJobById';
import { createJob } from '../../features/jobs/api/createJob';
import { deactivateJob } from '../../features/jobs/api/deactivateJob';
import { reactivateJob } from '../../features/jobs/api/reactivateJob';
import { sanitizeInput } from '../../utils/sanitizer';
import type { JobResponseModel } from '../../features/jobs/models/JobResponseModel';
import type { JobRequestModel } from '../../features/jobs/models/JobRequestModel';
import './ServicesPage.css';
import { updateJob } from '../../features/jobs/api/updateJob';
import { uploadJobImage } from '../../features/jobs/api/uploadJobImage';
import { deleteFile } from '../../features/files/api/deleteFile';
import ConfirmationModal from '../../components/ConfirmationModal';
import Toast from '../../shared/components/Toast';
import useAuthStore from '../../features/authentication/store/authStore';
import { fileDownloadUrl } from '../../shared/utils/fileUrl';

export default function ServicesPage(): React.ReactElement {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const isFrench = i18n.language === 'fr';
  const [jobs, setJobs] = useState<JobResponseModel[]>([]);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedJob, setSelectedJob] = useState<JobResponseModel | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [createLoading, setCreateLoading] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string>('');
  const [updateModalOpen, setUpdateModalOpen] = useState<boolean>(false);
  const [jobToUpdate, setJobToUpdate] = useState<JobResponseModel | null>(null);
  const [updateLoading, setUpdateLoading] = useState<boolean>(false);
  const [updateError, setUpdateError] = useState<string>('');
  const [updateFormData, setUpdateFormData] = useState<JobRequestModel>({
    jobName: '',
    jobDescription: '',
    jobNameFr: '',
    jobDescriptionFr: '',
    hourlyRate: 0,
    estimatedDurationMinutes: 0,
    jobType: 'QUOTATION',
    active: true,
  });
  const [formData, setFormData] = useState<JobRequestModel>({
    jobName: '',
    jobDescription: '',
    jobNameFr: '',
    jobDescriptionFr: '',
    hourlyRate: 0,
    estimatedDurationMinutes: 0,
    jobType: 'QUOTATION',
    active: true,
  });

  // Image file state
  const [createImageFile, setCreateImageFile] = useState<File | null>(null);
  const [updateImageFile, setUpdateImageFile] = useState<File | null>(null);

  // Deactivate/Reactivate state
  const [deactivateLoading, setDeactivateLoading] = useState<boolean>(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  } | null>(null);

  // Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    type: 'deactivate' | 'reactivate' | null;
    job: JobResponseModel | null;
  }>({
    isOpen: false,
    type: null,
    job: null,
  });

  // Image deletion state
  const [imageDeleteLoading, setImageDeleteLoading] = useState<boolean>(false);
  const [showImageDeleteConfirmation, setShowImageDeleteConfirmation] = useState<boolean>(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getJobs();
        setJobs(data);
      } catch (error) {
        console.error('Error loading jobs:', error);
        setToast({
          message: t('pages.services.failedToLoad'),
          type: 'error',
        });
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [t]);

  async function openDetails(jobId: string) {
    setModalOpen(true);
    setDetailLoading(true);
    setSelectedJob(null);
    try {
      const data = await getJobById(jobId);
      setSelectedJob(data);
    } catch (error) {
      console.error('Error loading job details:', error);
      setToast({
        message: t('pages.services.failedToLoadDetails'),
        type: 'error',
      });
    } finally {
      setDetailLoading(false);
    }
  }

  function closeModal() {
    setModalOpen(false);
    setSelectedJob(null);
  }

  function openCreateModal() {
    setCreateModalOpen(true);
    setCreateError('');
    setFormData({
      jobName: '',
      jobDescription: '',
      hourlyRate: 0,
      estimatedDurationMinutes: 0,
      jobType: 'QUOTATION',
      active: true,
    });
    setCreateImageFile(null);
  }

  function closeCreateModal() {
    setCreateModalOpen(false);
    setFormData({
      jobName: '',
      jobDescription: '',
      hourlyRate: 0,
      estimatedDurationMinutes: 0,
      jobType: 'QUOTATION',
      active: true,
    });
    setCreateError('');
    setCreateImageFile(null);
  }

  function openUpdateModal(jobId: string) {
    const jobToUpdate = jobs.find((j) => j.jobId === jobId) || null;
    if (jobToUpdate) {
      setJobToUpdate(jobToUpdate);
      setUpdateFormData({
        jobName: jobToUpdate.jobName,
        jobDescription: jobToUpdate.jobDescription,
        jobNameFr: jobToUpdate.jobNameFr || '',
        jobDescriptionFr: jobToUpdate.jobDescriptionFr || '',
        hourlyRate: jobToUpdate.hourlyRate,
        estimatedDurationMinutes: jobToUpdate.estimatedDurationMinutes,
        jobType: jobToUpdate.jobType,
        active: jobToUpdate.active,
      });
      setUpdateModalOpen(true);
      setUpdateError('');
      setUpdateImageFile(null);
    }
  }

  function closeUpdateModal() {
    setUpdateModalOpen(false);
    setJobToUpdate(null);
    setUpdateFormData({
      jobName: '',
      jobDescription: '',
      jobNameFr: '',
      jobDescriptionFr: '',
      hourlyRate: 0,
      estimatedDurationMinutes: 0,
      jobType: 'QUOTATION',
      active: true,
    });
    setUpdateError('');
    setUpdateImageFile(null);
  }

  function validateImageFile(file: File): string | null {
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB
    if (!file.type.startsWith('image/')) {
      return t('validation.invalidImageType');
    }
    if (file.size > maxSizeBytes) {
      return t('validation.imageTooLarge');
    }
    return null;
  }

  function handleCreateImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setCreateImageFile(null);
      return;
    }
    const err = validateImageFile(file);
    if (err) {
      setCreateError(err);
      setCreateImageFile(null);
    } else {
      setCreateError('');
      setCreateImageFile(file);
    }
  }

  function handleUpdateImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setUpdateImageFile(null);
      return;
    }
    const err = validateImageFile(file);
    if (err) {
      setUpdateError(err);
      setUpdateImageFile(null);
    } else {
      setUpdateError('');
      setUpdateImageFile(file);
    }
  }

  function handleUpdateFormChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setUpdateFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      // Prevent negative numbers and -- pattern
      let numValue = value === '' ? 0 : parseFloat(value) || 0;
      if (numValue < 0) {
        numValue = 0;
      }
      setUpdateFormData((prev) => ({
        ...prev,
        [name]: numValue,
      }));
    } else {
      // Sanitize text inputs and block dangerous patterns
      let sanitizedValue = value;
      if (name === 'jobName' || name === 'jobDescription') {
        sanitizedValue = sanitizeInput(sanitizedValue);
        // Block dangerous patterns like << >> -- SQL keywords
        sanitizedValue = sanitizedValue.replace(
          /<<|>>|--|';|DROP|DELETE|INSERT|UPDATE|SELECT|UNION|WHERE/gi,
          ''
        );
      }
      setUpdateFormData((prev) => ({ ...prev, [name]: sanitizedValue }));
    }
  }

  async function handleUpdateJob() {
    // Validate required fields
    if (!updateFormData.jobName.trim()) {
      setUpdateError(t('pages.services.jobNameRequired'));
      return;
    }
    if (!updateFormData.jobDescription.trim()) {
      setUpdateError(t('pages.services.jobDescriptionRequired'));
      return;
    }
    if (updateFormData.hourlyRate <= 0) {
      setUpdateError(t('pages.services.hourlyRateRequired'));
      return;
    }
    if (updateFormData.estimatedDurationMinutes <= 0) {
      setUpdateError(t('pages.services.durationRequired'));
      return;
    }

    if (!jobToUpdate) {
      return;
    }

    setUpdateLoading(true);
    setUpdateError('');

    try {
      const updatedJob = await updateJob(jobToUpdate.jobId, updateFormData);
      let finalJob = updatedJob;
      if (updateImageFile) {
        try {
          finalJob = await uploadJobImage(jobToUpdate.jobId, updateImageFile);
        } catch (imgErr) {
          console.error('Image upload failed during update:', imgErr);
          setToast({ message: t('messages.imageUploadFailed'), type: 'warning' });
        }
      }
      // Update the job in the list
      setJobs((prevJobs) => prevJobs.map((job) => (job.jobId === finalJob.jobId ? finalJob : job)));
      closeUpdateModal();
      // Show success notification
      setToast({
        message: t('pages.services.serviceUpdated'),
        type: 'success',
      });
    } catch (error) {
      // Try to extract backend error message if available
      let errorMsg = t('pages.services.failedToUpdate');
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as {
          response?: { data?: { message?: string }; status?: number };
        };
        if (axiosError.response?.data?.message) {
          errorMsg = axiosError.response.data.message;
        } else if (axiosError.response?.status) {
          errorMsg = `Request failed with status code ${axiosError.response.status}`;
        }
      } else if (error instanceof Error && error.message) {
        errorMsg = error.message;
      }
      setUpdateError(errorMsg);
    } finally {
      setUpdateLoading(false);
    }
  }

  function handleDeleteJobImage() {
    if (!jobToUpdate?.imageFileId || !jobToUpdate?.jobId) {
      return;
    }

    setShowImageDeleteConfirmation(true);
  }

  async function confirmDeleteJobImage() {
    if (!jobToUpdate?.imageFileId || !jobToUpdate?.jobId) {
      return;
    }

    setImageDeleteLoading(true);
    try {
      await deleteFile(jobToUpdate.imageFileId);

      // Update the job in the list
      setJobs((prevJobs) =>
        prevJobs.map((job) =>
          job.jobId === jobToUpdate.jobId ? { ...job, imageFileId: undefined } : job
        )
      );

      // Update the current job being edited
      setJobToUpdate({ ...jobToUpdate, imageFileId: undefined });

      // Clear the update form
      setUpdateImageFile(null);

      setToast({
        message: 'Image deleted successfully',
        type: 'success',
      });
    } catch (error) {
      let errorMsg = 'Failed to delete image';
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as {
          response?: { data?: { message?: string }; status?: number };
        };
        if (axiosError.response?.data?.message) {
          errorMsg = axiosError.response.data.message;
        }
      }
      setToast({
        message: errorMsg,
        type: 'error',
      });
    } finally {
      setImageDeleteLoading(false);
      setShowImageDeleteConfirmation(false);
    }
  }

  function handleFormChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      // Prevent negative numbers and -- pattern
      let numValue = value === '' ? 0 : parseFloat(value) || 0;
      if (numValue < 0) {
        numValue = 0;
      }
      setFormData((prev) => ({
        ...prev,
        [name]: numValue,
      }));
    } else {
      // Sanitize text inputs and block dangerous patterns
      let sanitizedValue = value;
      if (name === 'jobName' || name === 'jobDescription') {
        sanitizedValue = sanitizeInput(sanitizedValue);
        // Block dangerous patterns like << >> -- SQL keywords
        sanitizedValue = sanitizedValue.replace(
          /<<|>>|--|';|DROP|DELETE|INSERT|UPDATE|SELECT|UNION|WHERE/gi,
          ''
        );
      }
      setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));
    }
  }

  async function handleCreateJob() {
    // Validate required fields
    if (!formData.jobName.trim()) {
      setCreateError(t('pages.services.jobNameRequired'));
      return;
    }
    if (!formData.jobDescription.trim()) {
      setCreateError(t('pages.services.jobDescriptionRequired'));
      return;
    }
    if (formData.hourlyRate <= 0) {
      setCreateError(t('pages.services.hourlyRateRequired'));
      return;
    }
    if (formData.estimatedDurationMinutes <= 0) {
      setCreateError(t('pages.services.durationRequired'));
      return;
    }

    setCreateLoading(true);
    setCreateError('');

    try {
      const newJob = await createJob(formData);
      let finalJob = newJob;
      if (createImageFile) {
        try {
          finalJob = await uploadJobImage(newJob.jobId, createImageFile);
        } catch (imgErr) {
          console.error('Image upload failed during create:', imgErr);
          setToast({ message: t('messages.imageUploadFailed'), type: 'warning' });
        }
      }
      // Add the newly created job to the end of the list
      setJobs((prevJobs) => [...prevJobs, finalJob]);
      closeCreateModal();
      // Show success notification
      setToast({
        message: t('pages.services.serviceCreated'),
        type: 'success',
      });
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : t('pages.services.failedToCreate'));
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleDeactivateJob(job: JobResponseModel) {
    setConfirmationModal({
      isOpen: true,
      type: 'deactivate',
      job,
    });
  }

  async function confirmDeactivate() {
    if (!confirmationModal.job) return;

    setDeactivateLoading(true);
    try {
      const updatedJob = await deactivateJob(confirmationModal.job.jobId);
      setToast({
        message: t('pages.services.serviceDeactivated', {
          serviceName: confirmationModal.job.jobName,
        }),
        type: 'warning',
      });
      // Update the job in the list to show deactivated state
      setJobs(jobs.map((j) => (j.jobId === confirmationModal.job?.jobId ? updatedJob : j)));
    } catch (error) {
      console.error('Error deactivating job:', error);
      setToast({
        message: t('pages.services.failedToDeactivate'),
        type: 'error',
      });
    } finally {
      setDeactivateLoading(false);
      setConfirmationModal({ isOpen: false, type: null, job: null });
    }
  }

  async function handleReactivateJob(job: JobResponseModel) {
    setConfirmationModal({
      isOpen: true,
      type: 'reactivate',
      job,
    });
  }

  async function confirmReactivate() {
    if (!confirmationModal.job) return;

    setDeactivateLoading(true);
    try {
      const updatedJob = await reactivateJob(confirmationModal.job.jobId);
      setToast({
        message: t('pages.services.serviceReactivated', {
          serviceName: confirmationModal.job.jobName,
        }),
        type: 'success',
      });
      // Update the job in the list to show reactivated state
      setJobs(jobs.map((j) => (j.jobId === confirmationModal.job?.jobId ? updatedJob : j)));
    } catch (error) {
      console.error('Error reactivating job:', error);
      setToast({
        message: t('pages.services.failedToReactivate'),
        type: 'error',
      });
    } finally {
      setDeactivateLoading(false);
      setConfirmationModal({ isOpen: false, type: null, job: null });
    }
  }

  function toggleDescriptionExpanded(jobId: string) {
    setExpandedDescriptions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  }

  function isDescriptionTruncated(description: string): boolean {
    return description.length > 150;
  }

  function resolveJobImage(job: JobResponseModel): string {
    const url = fileDownloadUrl(job.imageFileId);
    return url ?? `https://via.placeholder.com/300x200?text=${encodeURIComponent(job.jobName)}`;
  }

  function getJobName(job: JobResponseModel): string {
    return isFrench && job.jobNameFr ? job.jobNameFr : job.jobName;
  }

  function getJobDescription(job: JobResponseModel): string {
    return isFrench && job.jobDescriptionFr ? job.jobDescriptionFr : job.jobDescription;
  }

  function getJobType(job: JobResponseModel): string {
    const typeMap: Record<string, string> = {
      'QUOTATION': isFrench ? t('pages.services.quotation') : 'Quotation',
      'INSTALLATION': isFrench ? t('pages.services.installation') : 'Installation',
      'REPARATION': isFrench ? t('pages.services.reparation') : 'Reparation',
      'MAINTENANCE': isFrench ? t('pages.services.maintenance') : 'Maintenance',
    };
    return typeMap[job.jobType] || job.jobType;
  }

  const DEFAULT_IMAGE_URL = '/assets/fallback.png';

  return (
    <div className="services-page">
      <div className="services-header">
        <div className="header-content">
          <h1 className="page-title">{t('pages.services.title')}</h1>
          <p className="page-subtitle">
            {isAdmin ? t('pages.services.adminSubtitle') : t('pages.services.customerSubtitle')}
          </p>
        </div>
        {isAdmin && (
          <button className="btn-add-service" onClick={openCreateModal}>
            <span className="btn-icon">+</span>
            {t('pages.services.addService')}
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>{t('common.loading')}</p>
        </div>
      ) : (
        <div className="services-grid">
          {jobs.map((j) => (
            <div
              key={j.jobId}
              className={`service-card-modern ${!j.active ? 'service-inactive' : ''}`}
            >
              {/* Image on the Left */}
              <div className="service-image-container">
                <div className="service-image-modern">
                  {j.imageFileId ? (
                    <img
                      src={resolveJobImage(j)}
                      alt={j.jobName}
                      className="service-image-tag"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = DEFAULT_IMAGE_URL;
                      }}
                    />
                  ) : (
                    <div className="image-placeholder">
                      <svg
                        className="image-icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path d="M21 21H3v-2l3-3 5 4 5-5 5 4v2z" />
                        <path d="M3 21V3h18v18" />
                        <circle cx="9" cy="9" r="2" />
                      </svg>
                      <span>Image</span>
                    </div>
                  )}
                </div>
                {!j.active && (
                  <div className="inactive-overlay">
                    <span className="inactive-badge-modern">{t('pages.services.inactive')}</span>
                  </div>
                )}
              </div>

              {/* Content in the Middle */}
              <div className="service-info">
                <div className="service-header-row">
                  <h3 className="service-title-modern">{getJobName(j)}</h3>
                  <div className="service-price">
                    <span className="price-label">{isFrench ? 'Prix' : 'Price'}</span>
                    <span className="price-value">${j.hourlyRate?.toFixed(2)}</span>
                    <span className="price-unit">{isFrench ? '/heure' : '/hour'}</span>
                  </div>
                </div>

                <div className="service-meta">
                  <div className="meta-item">
                    <svg
                      className="meta-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                    <span>{j.estimatedDurationMinutes} min</span>
                  </div>
                  <div className="meta-item">
                    <svg
                      className="meta-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path d="M20 7h-3V4c0-1-1-2-2-2H9c-1 0-2 1-2 2v3H4c-1 0-2 1-2 2v11c0 1 1 2 2 2h16c1 0 2-1 2-2V9c0-1-1-2-2-2zM9 4h6v3H9V4z" />
                    </svg>
                    <span>{getJobType(j)}</span>
                  </div>
                </div>

                <div className="service-description-modern">
                  <p
                    className={`description-text ${
                      expandedDescriptions.has(j.jobId) ? 'expanded' : 'collapsed'
                    }`}
                  >
                    {getJobDescription(j)}
                  </p>
                  {isDescriptionTruncated(getJobDescription(j)) && !isAdmin && (
                    <button
                      className="description-toggle"
                      onClick={() => toggleDescriptionExpanded(j.jobId)}
                      aria-expanded={expandedDescriptions.has(j.jobId)}
                    >
                      {expandedDescriptions.has(j.jobId) ? 'Voir moins' : 'Voir plus'}
                    </button>
                  )}
                </div>
              </div>

              {/* Actions on the Right */}
              <div className="service-actions-modern">
                {isAdmin ? (
                  <>
                    <button
                      className="action-btn primary"
                      onClick={() => void openDetails(j.jobId)}
                      disabled={!j.active}
                      title={t('pages.services.viewDetails')}
                    >
                      <svg
                        className="btn-icon-svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      {t('pages.services.viewDetails')}
                    </button>
                    <button
                      className="action-btn secondary"
                      onClick={() => void openUpdateModal(j.jobId)}
                      disabled={!j.active}
                      title={t('pages.services.modify')}
                    >
                      <svg
                        className="btn-icon-svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      {t('pages.services.modify')}
                    </button>
                    {j.active ? (
                      <button
                        className="action-btn danger"
                        onClick={() => handleDeactivateJob(j)}
                        disabled={deactivateLoading}
                        title={t('pages.services.deactivate')}
                      >
                        <svg
                          className="btn-icon-svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <path d="M4.93 4.93l14.14 14.14" />
                        </svg>
                        {t('pages.services.deactivate')}
                      </button>
                    ) : (
                      <button
                        className="action-btn success"
                        onClick={() => handleReactivateJob(j)}
                        disabled={deactivateLoading}
                        title={t('pages.services.reactivate')}
                      >
                        <svg
                          className="btn-icon-svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        {t('pages.services.reactivate')}
                      </button>
                    )}
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal>
          <div className="modal">
            <div className="modal-header">
              <h3 className="services-modal-title">{t('pages.services.serviceDetails')}</h3>
              <button className="modal-close-light" aria-label="Close" onClick={closeModal}>
                &#10005;
              </button>
            </div>

            {detailLoading && <div>{t('common.loading')}</div>}

            {!detailLoading && selectedJob && (
              <div className="service-details">
                {selectedJob.imageFileId ? (
                  <div className="service-detail-image-wrapper">
                    <img
                      src={resolveJobImage(selectedJob)}
                      alt={selectedJob.jobName}
                      className="service-detail-image"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = DEFAULT_IMAGE_URL;
                      }}
                    />
                  </div>
                ) : null}
                <p>
                  <strong>{t('pages.services.jobId')}:</strong> {selectedJob.jobId}
                </p>
                <p>
                  <strong>{t('pages.services.name')}:</strong> {getJobName(selectedJob)}
                </p>
                <p>
                  <strong>{t('pages.services.description')}:</strong> {getJobDescription(selectedJob)}
                </p>
                {isFrench && selectedJob.jobNameFr && (
                  <p>
                    <strong>{t('pages.services.nameFr')}:</strong> {selectedJob.jobNameFr}
                  </p>
                )}
                {isFrench && selectedJob.jobDescriptionFr && (
                  <p>
                    <strong>{t('pages.services.descriptionFr')}:</strong> {selectedJob.jobDescriptionFr}
                  </p>
                )}
                <p>
                  <strong>{t('pages.services.hourlyRate')}:</strong> $
                  {selectedJob.hourlyRate?.toFixed(2)}
                </p>
                <p>
                  <strong>{t('pages.services.estimatedDuration')}:</strong>{' '}
                  {selectedJob.estimatedDurationMinutes}
                </p>
                <p>
                  <strong>{t('pages.services.type')}:</strong> {getJobType(selectedJob)}
                </p>
                <p>
                  <strong>{t('common.active')}:</strong>{' '}
                  {selectedJob.active ? t('common.yes') : t('common.no')}
                </p>
              </div>
            )}

            {!detailLoading && !selectedJob && (
              <div className="service-details">{t('messages.noDetailsAvailable')}</div>
            )}
          </div>
        </div>
      )}

      {createModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal>
          <div className="modal">
            <div className="modal-header">
              <h3 className="services-modal-title">{t('pages.services.createNewService')}</h3>
              <button
                className="modal-close-light"
                aria-label="Close"
                onClick={closeCreateModal}
                disabled={createLoading}
              >
                &#10005;
              </button>
            </div>

            {createError && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                <span>{createError}</span>
              </div>
            )}

            <form
              className="create-job-form"
              onSubmit={(e) => {
                e.preventDefault();
                void handleCreateJob();
              }}
            >
              <div className="form-group">
                <label htmlFor="jobName">{t('pages.services.name')} *</label>
                <input
                  id="jobName"
                  type="text"
                  name="jobName"
                  value={formData.jobName}
                  onChange={handleFormChange}
                  placeholder={t('common.enterPlaceholder', {
                    field: t('pages.services.name'),
                  })}
                  disabled={createLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="jobDescription">{t('pages.services.description')} *</label>
                <textarea
                  id="jobDescription"
                  name="jobDescription"
                  value={formData.jobDescription}
                  onChange={handleFormChange}
                  placeholder={t('common.enterPlaceholder', {
                    field: t('pages.services.description'),
                  })}
                  disabled={createLoading}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label htmlFor="jobNameFr">{t('pages.services.nameFr')}</label>
                <input
                  id="jobNameFr"
                  type="text"
                  name="jobNameFr"
                  value={formData.jobNameFr || ''}
                  onChange={handleFormChange}
                  placeholder={t('common.enterPlaceholder', {
                    field: t('pages.services.nameFr'),
                  })}
                  disabled={createLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="jobDescriptionFr">{t('pages.services.descriptionFr')}</label>
                <textarea
                  id="jobDescriptionFr"
                  name="jobDescriptionFr"
                  value={formData.jobDescriptionFr || ''}
                  onChange={handleFormChange}
                  placeholder={t('common.enterPlaceholder', {
                    field: t('pages.services.descriptionFr'),
                  })}
                  disabled={createLoading}
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="hourlyRate">{t('pages.services.hourlyRate')} ($) *</label>
                  <input
                    id="hourlyRate"
                    type="number"
                    name="hourlyRate"
                    value={formData.hourlyRate || ''}
                    onChange={handleFormChange}
                    placeholder="0.00"
                    step="0.01"
                    disabled={createLoading}
                    className="no-arrows"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="estimatedDurationMinutes">
                    {t('pages.services.duration')} ({t('pages.services.minutes')}) *
                  </label>
                  <input
                    id="estimatedDurationMinutes"
                    type="number"
                    name="estimatedDurationMinutes"
                    value={formData.estimatedDurationMinutes || ''}
                    onChange={handleFormChange}
                    placeholder="0"
                    disabled={createLoading}
                    className="no-arrows"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="jobType">{t('pages.services.type')} *</label>
                  <select
                    id="jobType"
                    name="jobType"
                    value={formData.jobType}
                    onChange={handleFormChange}
                    disabled={createLoading}
                  >
                    <option value="QUOTATION">{isFrench ? t('pages.services.quotation') : 'Quotation'}</option>
                    <option value="INSTALLATION">{isFrench ? t('pages.services.installation') : 'Installation'}</option>
                    <option value="REPARATION">{isFrench ? t('pages.services.reparation') : 'Reparation'}</option>
                    <option value="MAINTENANCE">{isFrench ? t('pages.services.maintenance') : 'Maintenance'}</option>
                  </select>
                </div>

                <div className="form-group checkbox-group">
                  <label htmlFor="active">
                    <input
                      id="active"
                      type="checkbox"
                      name="active"
                      checked={formData.active}
                      onChange={handleFormChange}
                      disabled={createLoading}
                    />
                    {t('common.active')}
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="createImage">
                  {t('pages.services.imageOptional')} ({t('common.max')}: 10MB)
                </label>
                <input
                  id="createImage"
                  type="file"
                  accept="image/*"
                  onChange={handleCreateImageChange}
                  disabled={createLoading}
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={closeCreateModal}
                  disabled={createLoading}
                >
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn-create" disabled={createLoading}>
                  {createLoading ? t('common.creating') : t('pages.services.createService')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {updateModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal onClick={closeUpdateModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="services-modal-title">{t('pages.services.modifyService')}</h3>
              <button
                className="modal-close-light"
                aria-label="Close"
                onClick={closeUpdateModal}
                disabled={updateLoading}
              >
                &#10005;
              </button>
            </div>

            {updateError && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                <span>{updateError}</span>
              </div>
            )}

            <form
              className="create-job-form"
              onSubmit={(e) => {
                e.preventDefault();
                void handleUpdateJob();
              }}
            >
              <div className="form-group">
                <label htmlFor="updateJobName">{t('pages.services.name')} *</label>
                <input
                  id="updateJobName"
                  type="text"
                  name="jobName"
                  value={updateFormData.jobName}
                  onChange={handleUpdateFormChange}
                  placeholder={t('common.enterPlaceholder', {
                    field: t('pages.services.name'),
                  })}
                  disabled={updateLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="updateJobDescription">{t('pages.services.description')} *</label>
                <textarea
                  id="updateJobDescription"
                  name="jobDescription"
                  value={updateFormData.jobDescription}
                  onChange={handleUpdateFormChange}
                  placeholder={t('common.enterPlaceholder', {
                    field: t('pages.services.description'),
                  })}
                  disabled={updateLoading}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label htmlFor="updateJobNameFr">{t('pages.services.nameFr')}</label>
                <input
                  id="updateJobNameFr"
                  type="text"
                  name="jobNameFr"
                  value={updateFormData.jobNameFr || ''}
                  onChange={handleUpdateFormChange}
                  placeholder={t('common.enterPlaceholder', {
                    field: t('pages.services.nameFr'),
                  })}
                  disabled={updateLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="updateJobDescriptionFr">{t('pages.services.descriptionFr')}</label>
                <textarea
                  id="updateJobDescriptionFr"
                  name="jobDescriptionFr"
                  value={updateFormData.jobDescriptionFr || ''}
                  onChange={handleUpdateFormChange}
                  placeholder={t('common.enterPlaceholder', {
                    field: t('pages.services.descriptionFr'),
                  })}
                  disabled={updateLoading}
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="updateHourlyRate">{t('pages.services.hourlyRate')} ($) *</label>
                  <input
                    id="updateHourlyRate"
                    type="number"
                    name="hourlyRate"
                    value={updateFormData.hourlyRate || ''}
                    onChange={handleUpdateFormChange}
                    placeholder="0.00"
                    step="0.01"
                    disabled={updateLoading}
                    className="no-arrows"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="updateEstimatedDurationMinutes">
                    {t('pages.services.duration')} ({t('pages.services.minutes')}) *
                  </label>
                  <input
                    id="updateEstimatedDurationMinutes"
                    type="number"
                    name="estimatedDurationMinutes"
                    value={updateFormData.estimatedDurationMinutes || ''}
                    onChange={handleUpdateFormChange}
                    placeholder="0"
                    disabled={updateLoading}
                    className="no-arrows"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="updateJobType">{t('pages.services.type')} *</label>
                  <select
                    id="updateJobType"
                    name="jobType"
                    value={updateFormData.jobType}
                    onChange={handleUpdateFormChange}
                    disabled={updateLoading}
                  >
                    <option value="QUOTATION">{isFrench ? t('pages.services.quotation') : 'Quotation'}</option>
                    <option value="INSTALLATION">{isFrench ? t('pages.services.installation') : 'Installation'}</option>
                    <option value="REPARATION">{isFrench ? t('pages.services.reparation') : 'Reparation'}</option>
                    <option value="MAINTENANCE">{isFrench ? t('pages.services.maintenance') : 'Maintenance'}</option>
                  </select>
                </div>

                <div className="form-group checkbox-group">
                  <label htmlFor="updateActive">
                    <input
                      id="updateActive"
                      type="checkbox"
                      name="active"
                      checked={updateFormData.active}
                      onChange={handleUpdateFormChange}
                      disabled={updateLoading}
                    />
                    {t('common.active')}
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="updateImage">
                  {t('pages.services.imageOptional')} ({t('common.max')}: 10MB)
                </label>
                <input
                  id="updateImage"
                  type="file"
                  accept="image/*"
                  onChange={handleUpdateImageChange}
                  disabled={updateLoading}
                />
                {jobToUpdate?.imageFileId && (
                  <div>
                    <div className="image-preview-container" style={{ marginTop: '10px' }}>
                      <img
                        src={resolveJobImage(jobToUpdate)}
                        alt="Current job image"
                        style={{
                          maxWidth: '200px',
                          maxHeight: '150px',
                          borderRadius: '6px',
                          marginBottom: '10px',
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {jobToUpdate?.imageFileId && (
                <div className="form-group">
                  <button
                    type="button"
                    className="btn-delete-image"
                    onClick={handleDeleteJobImage}
                    disabled={updateLoading || imageDeleteLoading}
                  >
                    <Trash2 size={18} />
                    Delete Image
                  </button>
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={closeUpdateModal}
                  disabled={updateLoading}
                >
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn-create" disabled={updateLoading}>
                  {updateLoading ? t('common.updating') : t('pages.services.updateService')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        title={
          confirmationModal.type === 'deactivate'
            ? t('pages.services.deactivateService')
            : t('pages.services.reactivateService')
        }
        message={
          confirmationModal.type === 'deactivate'
            ? t('pages.services.deactivateConfirmMessage', {
                serviceName: confirmationModal.job?.jobName,
              })
            : t('pages.services.reactivateConfirmMessage', {
                serviceName: confirmationModal.job?.jobName,
              })
        }
        confirmText={
          confirmationModal.type === 'deactivate'
            ? t('pages.services.deactivate')
            : t('pages.services.reactivate')
        }
        cancelText={t('common.cancel')}
        isDanger={confirmationModal.type === 'deactivate'}
        isLoading={deactivateLoading}
        onConfirm={confirmationModal.type === 'deactivate' ? confirmDeactivate : confirmReactivate}
        onCancel={() => setConfirmationModal({ isOpen: false, type: null, job: null })}
      />

      <ConfirmationModal
        isOpen={showImageDeleteConfirmation}
        title="Delete Image"
        message="Are you sure you want to permanently delete this image?"
        confirmText="Delete"
        cancelText="Cancel"
        isDanger={true}
        isLoading={imageDeleteLoading}
        onConfirm={confirmDeleteJobImage}
        onCancel={() => setShowImageDeleteConfirmation(false)}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
