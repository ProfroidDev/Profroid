import React, { useEffect, useState } from "react";
import { getJobs } from "../../features/jobs/api/getAllJobs";
import { getJobById } from "../../features/jobs/api/getJobById";
import { createJob } from "../../features/jobs/api/createJob";
import { deactivateJob } from "../../features/jobs/api/deactivateJob";
import { reactivateJob } from "../../features/jobs/api/reactivateJob";
import type { JobResponseModel } from "../../features/jobs/models/JobResponseModel";
import type { JobRequestModel } from "../../features/jobs/models/JobRequestModel";
import "./ServicesPage.css";
import { updateJob } from "../../features/jobs/api/updateJob";
import ConfirmationModal from "../../components/ConfirmationModal";
import Toast from "../../shared/components/Toast";
import useAuthStore from "../../features/authentication/store/authStore";

export default function ServicesPage(): React.ReactElement {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";
  const [jobs, setJobs] = useState<JobResponseModel[]>([]);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedJob, setSelectedJob] = useState<JobResponseModel | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [createLoading, setCreateLoading] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string>("");
  const [updateModalOpen, setUpdateModalOpen] = useState<boolean>(false);
  const [jobToUpdate, setJobToUpdate] = useState<JobResponseModel | null>(null);
  const [updateLoading, setUpdateLoading] = useState<boolean>(false);
  const [updateError, setUpdateError] = useState<string>("");
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

  // Deactivate/Reactivate state
  const [deactivateLoading, setDeactivateLoading] = useState<boolean>(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info" | "warning";
  } | null>(null);

  // Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    type: "deactivate" | "reactivate" | null;
    job: JobResponseModel | null;
  }>({
    isOpen: false,
    type: null,
    job: null,
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getJobs();
        setJobs(data);
      } catch (error) {
        console.error("Error loading jobs:", error);
        setToast({
          message: "Failed to load services",
          type: "error",
        });
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
    } catch (error) {
      console.error("Error loading job details:", error);
      setToast({
        message: "Failed to load service details",
        type: "error",
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
      setToast({
        message: "Service has been updated successfully!",
        type: "success",
      });
    } catch (error) {
      // Try to extract backend error message if available
      let errorMsg = "Failed to update service";
      if (error && typeof error === "object" && "response" in error) {
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
      setToast({
        message: "Service has been created successfully!",
        type: "success",
      });
    } catch (error) {
      setCreateError(
        error instanceof Error ? error.message : "Failed to create service"
      );
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleDeactivateJob(job: JobResponseModel) {
    setConfirmationModal({
      isOpen: true,
      type: "deactivate",
      job,
    });
  }

  async function confirmDeactivate() {
    if (!confirmationModal.job) return;

    setDeactivateLoading(true);
    try {
      const updatedJob = await deactivateJob(confirmationModal.job.jobId);
      setToast({
        message: `${confirmationModal.job.jobName} has been deactivated. You can reactivate it at any time.`,
        type: "warning",
      });
      // Update the job in the list to show deactivated state
      setJobs(
        jobs.map((j) =>
          j.jobId === confirmationModal.job?.jobId ? updatedJob : j
        )
      );
    } catch (error) {
      console.error("Error deactivating job:", error);
      setToast({ message: "Failed to deactivate service", type: "error" });
    } finally {
      setDeactivateLoading(false);
      setConfirmationModal({ isOpen: false, type: null, job: null });
    }
  }

  async function handleReactivateJob(job: JobResponseModel) {
    setConfirmationModal({
      isOpen: true,
      type: "reactivate",
      job,
    });
  }

  async function confirmReactivate() {
    if (!confirmationModal.job) return;

    setDeactivateLoading(true);
    try {
      const updatedJob = await reactivateJob(confirmationModal.job.jobId);
      setToast({
        message: `${confirmationModal.job.jobName} has been reactivated successfully!`,
        type: "success",
      });
      // Update the job in the list to show reactivated state
      setJobs(
        jobs.map((j) =>
          j.jobId === confirmationModal.job?.jobId ? updatedJob : j
        )
      );
    } catch (error) {
      console.error("Error reactivating job:", error);
      setToast({ message: "Failed to reactivate service", type: "error" });
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

  return (
    <div className="services-page">
      <div className="services-header">
        <h2>Services</h2>
        {isAdmin && (
          <button className="btn-add-service" onClick={openCreateModal}>
            + Add Service
          </button>
        )}
      </div>

      {loading ? (
        <div>Loading services...</div>
      ) : (
        <div className="services-list">
          {jobs.map((j) => (
            <div
              key={j.jobId}
              className={`service-card-wrapper ${
                !j.active ? "service-inactive" : ""
              }`}
            >
              <div className="service-card">
                <div className="service-image" aria-hidden>
                  <span>Image</span>
                </div>

                <div className="service-content">
                  <h3 className="service-title">
                    {j.jobName}
                    {!j.active && (
                      <span className="inactive-badge"> (Inactive)</span>
                    )}
                  </h3>
                  <div className="service-description-wrapper">
                    <p
                      className={`service-desc ${
                        expandedDescriptions.has(j.jobId)
                          ? "expanded"
                          : "collapsed"
                      }`}
                    >
                      {j.jobDescription}
                    </p>
                    {isDescriptionTruncated(j.jobDescription) && !isAdmin && (
                      <button
                        className="description-expand-btn"
                        onClick={() => toggleDescriptionExpanded(j.jobId)}
                        aria-expanded={expandedDescriptions.has(j.jobId)}
                      >
                        {expandedDescriptions.has(j.jobId) ? "▲" : "▼"}
                      </button>
                    )}
                  </div>
                </div>

                <div className="service-actions">
                  <div className="service-rate">
                    ${j.hourlyRate?.toFixed(2)}
                  </div>

                  {isAdmin ? (
                    <>
                      <button
                        className="btn-view-light"
                        onClick={() => void openDetails(j.jobId)}
                        disabled={!j.active}
                      >
                        View Details
                      </button>
                      <button
                        className="btn-view-light"
                        onClick={() => void openUpdateModal(j.jobId)}
                        disabled={!j.active}
                      >
                        Modify
                      </button>
                      {j.active ? (
                        <button
                          className="btn-view-light"
                          style={{
                            marginLeft: 8,
                            backgroundColor: "#ff6b6b",
                            color: "white",
                          }}
                          onClick={() => handleDeactivateJob(j)}
                          disabled={deactivateLoading}
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          className="btn-view-light"
                          style={{
                            marginLeft: 8,
                            backgroundColor: "#51cf66",
                            color: "white",
                          }}
                          onClick={() => handleReactivateJob(j)}
                          disabled={deactivateLoading}
                        >
                          Reactivate
                        </button>
                      )}
                    </>
                  ) : null}
                </div>
              </div>
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

      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        title={
          confirmationModal.type === "deactivate"
            ? "Deactivate Service"
            : "Reactivate Service"
        }
        message={
          confirmationModal.type === "deactivate"
            ? `Are you sure you want to deactivate "${confirmationModal.job?.jobName}"? This service will no longer be available for appointments.`
            : `Are you sure you want to reactivate "${confirmationModal.job?.jobName}"? This service will become available again.`
        }
        confirmText={
          confirmationModal.type === "deactivate" ? "Deactivate" : "Reactivate"
        }
        cancelText="Cancel"
        isDanger={confirmationModal.type === "deactivate"}
        isLoading={deactivateLoading}
        onConfirm={
          confirmationModal.type === "deactivate"
            ? confirmDeactivate
            : confirmReactivate
        }
        onCancel={() =>
          setConfirmationModal({ isOpen: false, type: null, job: null })
        }
      />

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
