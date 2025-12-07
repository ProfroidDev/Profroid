import React, { useEffect, useState } from "react";
import { getJobs } from "../../features/jobs/api/getAllJobs";
import { getJobById } from "../../features/jobs/api/getJobById";
import { createJob } from "../../features/jobs/api/createJob";
import { deleteJob } from "../../features/jobs/api/deleteJob";
import type { JobResponseModel } from "../../features/jobs/models/JobResponseModel";
import type { JobRequestModel } from "../../features/jobs/models/JobRequestModel";
import "./ServicesPage.css";
import { updateJob } from "../../features/jobs/api/updateJob";

export default function ServicesPage(): React.ReactElement {
  const [jobs, setJobs] = useState<JobResponseModel[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedJob, setSelectedJob] = useState<JobResponseModel | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [createLoading, setCreateLoading] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string>("");
  const [showSuccessNotification, setShowSuccessNotification] =
    useState<boolean>(false);
  const [showDeleteSuccessNotification, setShowDeleteSuccessNotification] =
    useState<boolean>(false);
  const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] =
    useState<boolean>(false);
  const [jobToDelete, setJobToDelete] = useState<JobResponseModel | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string>("");
  const [updateModalOpen, setUpdateModalOpen] = useState<boolean>(false);
  const [jobToUpdate, setJobToUpdate] = useState<JobResponseModel | null>(null);
  const [updateLoading, setUpdateLoading] = useState<boolean>(false);
  const [updateError, setUpdateError] = useState<string>("");
  const [showUpdateSuccessNotification, setShowUpdateSuccessNotification] =
    useState<boolean>(false);
  const [updateFormData, setUpdateFormData] = useState<JobRequestModel>({
    jobName: "",
    jobDescription: "",
    hourlyRate: 0,
    estimatedDurationMinutes: 0,
    jobType: "QUOTATION",
    active: true,
  });
  const [formData, setFormData] = useState<JobRequestModel>({
    jobName: "",
    jobDescription: "",
    hourlyRate: 0,
    estimatedDurationMinutes: 0,
    jobType: "QUOTATION",
    active: true,
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getJobs();
        setJobs(data);
      } catch {
        // handle error
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  async function openDetails(jobId: string) {
    setModalOpen(true);
    setDetailLoading(true);
    setSelectedJob(null);
    try {
      const data = await getJobById(jobId);
      setSelectedJob(data);
    } catch {
      // handle
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
    setCreateError("");
    setFormData({
      jobName: "",
      jobDescription: "",
      hourlyRate: 0,
      estimatedDurationMinutes: 0,
      jobType: "QUOTATION",
      active: true,
    });
  }

  function closeCreateModal() {
    setCreateModalOpen(false);
    setFormData({
      jobName: "",
      jobDescription: "",
      hourlyRate: 0,
      estimatedDurationMinutes: 0,
      jobType: "QUOTATION",
      active: true,
    });
    setCreateError("");
  }

  function openDeleteConfirm(jobId: string) {
    const jobToDelete = jobs.find((j) => j.jobId === jobId) || null;
    setJobToDelete(jobToDelete);
    setDeleteConfirmModalOpen(true);
    setDeleteError("");
  }

  function closeDeleteConfirm() {
    setDeleteConfirmModalOpen(false);
    setJobToDelete(null);
    setDeleteError("");
  }

  async function handleDeleteJob() {
    if (!jobToDelete) {
      return;
    }

    setDeleteLoading(true);
    setDeleteError("");

    try {
      await deleteJob(jobToDelete.jobId);
      // Remove the deleted job from the list
      setJobs((prevJobs) =>
        prevJobs.filter((job) => job.jobId !== jobToDelete.jobId)
      );
      closeDeleteConfirm();
      // Show success notification
      setShowDeleteSuccessNotification(true);
      // Auto-hide after 3 seconds
      setTimeout(() => {
        setShowDeleteSuccessNotification(false);
      }, 3000);
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "Failed to delete service"
      );
    } finally {
      setDeleteLoading(false);
    }
  }

  function openUpdateModal(jobId: string) {
    const jobToUpdate = jobs.find((j) => j.jobId === jobId) || null;
    if (jobToUpdate) {
      setJobToUpdate(jobToUpdate);
      setUpdateFormData({
        jobName: jobToUpdate.jobName,
        jobDescription: jobToUpdate.jobDescription,
        hourlyRate: jobToUpdate.hourlyRate,
        estimatedDurationMinutes: jobToUpdate.estimatedDurationMinutes,
        jobType: jobToUpdate.jobType,
        active: jobToUpdate.active,
      });
      setUpdateModalOpen(true);
      setUpdateError("");
    }
  }

  function closeUpdateModal() {
    setUpdateModalOpen(false);
    setJobToUpdate(null);
    setUpdateFormData({
      jobName: "",
      jobDescription: "",
      hourlyRate: 0,
      estimatedDurationMinutes: 0,
      jobType: "QUOTATION",
      active: true,
    });
    setUpdateError("");
  }

  function handleUpdateFormChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setUpdateFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "number") {
      setUpdateFormData((prev) => ({
        ...prev,
        [name]: value === "" ? 0 : parseFloat(value) || 0,
      }));
    } else {
      setUpdateFormData((prev) => ({ ...prev, [name]: value }));
    }
  }

  async function handleUpdateJob() {
    // Validate required fields
    if (!updateFormData.jobName.trim()) {
      setUpdateError("Job name is required");
      return;
    }
    if (!updateFormData.jobDescription.trim()) {
      setUpdateError("Job description is required");
      return;
    }
    if (updateFormData.hourlyRate <= 0) {
      setUpdateError("Hourly rate must be greater than 0");
      return;
    }
    if (updateFormData.estimatedDurationMinutes <= 0) {
      setUpdateError("Estimated duration must be greater than 0");
      return;
    }

    if (!jobToUpdate) {
      return;
    }

    setUpdateLoading(true);
    setUpdateError("");

    try {
      const updatedJob = await updateJob(jobToUpdate.jobId, updateFormData);
      // Update the job in the list
      setJobs((prevJobs) =>
        prevJobs.map((job) =>
          job.jobId === updatedJob.jobId ? updatedJob : job
        )
      );
      closeUpdateModal();
      // Show success notification
      setShowUpdateSuccessNotification(true);
      // Auto-hide after 3 seconds
      setTimeout(() => {
        setShowUpdateSuccessNotification(false);
      }, 3000);
    } catch (error) {
      // Try to extract backend error message if available
      let errorMsg = "Failed to update service";
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { data?: { message?: string }, status?: number } };
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

  function handleFormChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "number") {
      // Allow empty string to clear the field
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? 0 : parseFloat(value) || 0,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  }

  async function handleCreateJob() {
    // Validate required fields
    if (!formData.jobName.trim()) {
      setCreateError("Job name is required");
      return;
    }
    if (!formData.jobDescription.trim()) {
      setCreateError("Job description is required");
      return;
    }
    if (formData.hourlyRate <= 0) {
      setCreateError("Hourly rate must be greater than 0");
      return;
    }
    if (formData.estimatedDurationMinutes <= 0) {
      setCreateError("Estimated duration must be greater than 0");
      return;
    }

    setCreateLoading(true);
    setCreateError("");

    try {
      const newJob = await createJob(formData);
      // Add the newly created job to the end of the list
      setJobs((prevJobs) => [...prevJobs, newJob]);
      closeCreateModal();
      // Show success notification
      setShowSuccessNotification(true);
      // Auto-hide after 3 seconds
      setTimeout(() => {
        setShowSuccessNotification(false);
      }, 3000);
    } catch (error) {
      setCreateError(
        error instanceof Error ? error.message : "Failed to create service"
      );
    } finally {
      setCreateLoading(false);
    }
  }

  return (
    <div className="services-page">
      <div className="services-header">
        <h2>Services</h2>
        <button className="btn-add-service" onClick={openCreateModal}>
          + Add Service
        </button>
      </div>

      {loading ? (
        <div>Loading services...</div>
      ) : (
        <div className="services-list">
          {jobs.map((j) => (
            <div key={j.jobId} className="service-card-wrapper">
              <div className="service-card">
                <div className="service-image" aria-hidden>
                  <span>Image</span>
                </div>

                <div className="service-content">
                  <h3 className="service-title">{j.jobName}</h3>
                  <p className="service-desc">{j.jobDescription}</p>
                </div>

                <div className="service-actions">
                  <div className="service-rate">
                    ${j.hourlyRate?.toFixed(2)}
                  </div>
                  <button
                    className="btn-view-light"
                    onClick={() => void openDetails(j.jobId)}
                  >
                    View Details
                  </button>
                  <button
                    className="btn-view-light"
                    onClick={() => void openUpdateModal(j.jobId)}
                  >
                    Modify
                  </button>
                </div>
              </div>
              <button
                className="service-delete-btn"
                onClick={() => void openDeleteConfirm(j.jobId)}
                aria-label="Delete service"
                title="Delete service"
              ></button>
                {/* Trash/Delete SVG icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  focusable="false"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m5 0V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal>
          <div className="modal">
            <div className="modal-header">
              <h3>Service Details</h3>
              <button
                className="modal-close-light"
                aria-label="Close"
                onClick={closeModal}
              >
                &#10005;
              </button>
            </div>

            {detailLoading && <div>Loading details...</div>}

            {!detailLoading && selectedJob && (
              <div className="service-details">
                <p>
                  <strong>Job ID:</strong> {selectedJob.jobId}
                </p>
                <p>
                  <strong>Name:</strong> {selectedJob.jobName}
                </p>
                <p>
                  <strong>Description:</strong> {selectedJob.jobDescription}
                </p>
                <p>
                  <strong>Hourly Rate:</strong> $
                  {selectedJob.hourlyRate?.toFixed(2)}
                </p>
                <p>
                  <strong>Estimated Duration (mins):</strong>{" "}
                  {selectedJob.estimatedDurationMinutes}
                </p>
                <p>
                  <strong>Type:</strong> {selectedJob.jobType}
                </p>
                <p>
                  <strong>Active:</strong> {selectedJob.active ? "Yes" : "No"}
                </p>
              </div>
            )}

            {!detailLoading && !selectedJob && (
              <div className="service-details">No details available.</div>
            )}
          </div>
        </div>
      )}

      {createModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal>
          <div className="modal">
            <div className="modal-header">
              <h3>Create New Service</h3>
              <button
                className="modal-close-light"
                aria-label="Close"
                onClick={closeCreateModal}
                disabled={createLoading}
              >
                &#10005;
              </button>
            </div>

            {createError && <div className="error-message">{createError}</div>}

            <form
              className="create-job-form"
              onSubmit={(e) => {
                e.preventDefault();
                void handleCreateJob();
              }}
            >
              <div className="form-group">
                <label htmlFor="jobName">Job Name *</label>
                <input
                  id="jobName"
                  type="text"
                  name="jobName"
                  value={formData.jobName}
                  onChange={handleFormChange}
                  placeholder="Enter job name"
                  disabled={createLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="jobDescription">Description *</label>
                <textarea
                  id="jobDescription"
                  name="jobDescription"
                  value={formData.jobDescription}
                  onChange={handleFormChange}
                  placeholder="Enter job description"
                  disabled={createLoading}
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="hourlyRate">Hourly Rate ($) *</label>
                  <input
                    id="hourlyRate"
                    type="number"
                    name="hourlyRate"
                    value={formData.hourlyRate || ""}
                    onChange={handleFormChange}
                    placeholder="0.00"
                    step="0.01"
                    disabled={createLoading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="estimatedDurationMinutes">
                    Duration (mins) *
                  </label>
                  <input
                    id="estimatedDurationMinutes"
                    type="number"
                    name="estimatedDurationMinutes"
                    value={formData.estimatedDurationMinutes || ""}
                    onChange={handleFormChange}
                    placeholder="0"
                    disabled={createLoading}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="jobType">Job Type *</label>
                  <select
                    id="jobType"
                    name="jobType"
                    value={formData.jobType}
                    onChange={handleFormChange}
                    disabled={createLoading}
                  >
                    <option value="QUOTATION">Quotation</option>
                    <option value="INSTALLATION">Installation</option>
                    <option value="REPARATION">Reparation</option>
                    <option value="MAINTENANCE">Maintenance</option>
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
                    Active
                  </label>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={closeCreateModal}
                  disabled={createLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-create"
                  disabled={createLoading}
                >
                  {createLoading ? "Creating..." : "Create Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSuccessNotification && (
        <div className="success-notification">
          <div className="success-content">
            <div className="success-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="black"
                strokeWidth="3.5"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div className="success-text">
              <h4>Service Added Successfully</h4>
              <p>The Service is now active</p>
            </div>
          </div>
        </div>
      )}

      {showDeleteSuccessNotification && (
        <div className="delete-success-notification">
          <div className="delete-success-content">
            <div className="delete-success-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div className="delete-success-text">
              <h4>Service Deleted Successfully</h4>
              <p>The service is no longer active</p>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmModalOpen && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal
          onClick={closeDeleteConfirm}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Service</h3>
              <button
                className="modal-close-light"
                aria-label="Close"
                onClick={closeDeleteConfirm}
                disabled={deleteLoading}
              >
                &#10005;
              </button>
            </div>

            {deleteError && <div className="error-message">{deleteError}</div>}

            {jobToDelete && (
              <>
                <div className="service-details">
                  <p>
                    <strong>Job ID:</strong> {jobToDelete.jobId}
                  </p>
                  <p>
                    <strong>Service Name:</strong> {jobToDelete.jobName}
                  </p>
                  <p>
                    <strong>Description:</strong> {jobToDelete.jobDescription}
                  </p>
                  <p>
                    <strong>Hourly Rate:</strong> $
                    {jobToDelete.hourlyRate?.toFixed(2)}
                  </p>
                  <p>
                    <strong>Estimated Duration (mins):</strong>{" "}
                    {jobToDelete.estimatedDurationMinutes}
                  </p>
                  <p>
                    <strong>Type:</strong> {jobToDelete.jobType}
                  </p>
                  <p>
                    <strong>Active:</strong> {jobToDelete.active ? "Yes" : "No"}
                  </p>
                </div>

                <div className="service-details" style={{ marginTop: "16px" }}>
                  <p style={{ color: "#d32f2f", fontWeight: "600" }}>
                    Are you sure you want to delete this service?
                  </p>
                  <p style={{ color: "#666" }}>This action cannot be undone.</p>
                </div>
              </>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={closeDeleteConfirm}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-create"
                onClick={() => void handleDeleteJob()}
                disabled={deleteLoading}
                style={{ backgroundColor: "#d32f2f" }}
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {updateModalOpen && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal
          onClick={closeUpdateModal}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Modify Service</h3>
              <button
                className="modal-close-light"
                aria-label="Close"
                onClick={closeUpdateModal}
                disabled={updateLoading}
              >
                &#10005;
              </button>
            </div>

            {updateError && <div className="error-message">{updateError}</div>}

            <form
              className="create-job-form"
              onSubmit={(e) => {
                e.preventDefault();
                void handleUpdateJob();
              }}
            >
              <div className="form-group">
                <label htmlFor="updateJobName">Job Name *</label>
                <input
                  id="updateJobName"
                  type="text"
                  name="jobName"
                  value={updateFormData.jobName}
                  onChange={handleUpdateFormChange}
                  placeholder="Enter job name"
                  disabled={updateLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="updateJobDescription">Description *</label>
                <textarea
                  id="updateJobDescription"
                  name="jobDescription"
                  value={updateFormData.jobDescription}
                  onChange={handleUpdateFormChange}
                  placeholder="Enter job description"
                  disabled={updateLoading}
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="updateHourlyRate">Hourly Rate ($) *</label>
                  <input
                    id="updateHourlyRate"
                    type="number"
                    name="hourlyRate"
                    value={updateFormData.hourlyRate || ""}
                    onChange={handleUpdateFormChange}
                    placeholder="0.00"
                    step="0.01"
                    disabled={updateLoading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="updateEstimatedDurationMinutes">
                    Duration (mins) *
                  </label>
                  <input
                    id="updateEstimatedDurationMinutes"
                    type="number"
                    name="estimatedDurationMinutes"
                    value={updateFormData.estimatedDurationMinutes || ""}
                    onChange={handleUpdateFormChange}
                    placeholder="0"
                    disabled={updateLoading}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="updateJobType">Job Type *</label>
                  <select
                    id="updateJobType"
                    name="jobType"
                    value={updateFormData.jobType}
                    onChange={handleUpdateFormChange}
                    disabled={updateLoading}
                  >
                    <option value="QUOTATION">Quotation</option>
                    <option value="INSTALLATION">Installation</option>
                    <option value="REPARATION">Reparation</option>
                    <option value="MAINTENANCE">Maintenance</option>
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
                    Active
                  </label>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={closeUpdateModal}
                  disabled={updateLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-create"
                  disabled={updateLoading}
                >
                  {updateLoading ? "Updating..." : "Update Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showUpdateSuccessNotification && (
        <div className="success-notification">
          <div className="success-content">
            <div className="success-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="black"
                strokeWidth="3.5"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div className="success-text">
              <h4>Service Updated Successfully</h4>
              <p>The service has been modified</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
