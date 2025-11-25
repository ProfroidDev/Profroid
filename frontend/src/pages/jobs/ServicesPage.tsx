import React, { useEffect, useState } from "react";
import { getJobs } from "../../features/jobs/api/getAllJobs";
import { getJobById } from "../../features/jobs/api/getJobById";
import type { JobResponseModel } from "../../features/jobs/models/JobResponseModel";
import "./ServicesPage.css";

export default function ServicesPage(): React.ReactElement {
  const [jobs, setJobs] = useState<JobResponseModel[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedJob, setSelectedJob] = useState<JobResponseModel | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getJobs();
        setJobs(data.slice(0, 4)); // show first 4 services
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

  return (
    <div className="services-page">
      <h2>Services</h2>

      {loading ? (
        <div>Loading services...</div>
      ) : (
        <div className="services-list">
          {jobs.map((j) => (
            <div key={j.jobId} className="service-card">
              <div className="service-image" aria-hidden>
                <span>Image</span>
              </div>

              <div className="service-content">
                <h3 className="service-title">{j.jobName}</h3>
                <p className="service-desc">{j.jobDescription}</p>
              </div>

              <div className="service-actions">
                <div className="service-rate">${j.hourlyRate?.toFixed(2)}</div>
                <button className="btn-view-light" onClick={() => void openDetails(j.jobId)}>View Details</button>
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
              <button className="modal-close-light" aria-label="Close" onClick={closeModal}>✕</button>
            </div>

            {detailLoading && <div>Loading details...</div>}

            {!detailLoading && selectedJob && (
              <div className="service-details">
                <p><strong>Job ID:</strong> {selectedJob.jobId}</p>
                <p><strong>Name:</strong> {selectedJob.jobName}</p>
                <p><strong>Description:</strong> {selectedJob.jobDescription}</p>
                <p><strong>Hourly Rate:</strong> ${selectedJob.hourlyRate?.toFixed(2)}</p>
                <p><strong>Estimated Duration (mins):</strong> {selectedJob.estimatedDurationMinutes}</p>
                <p><strong>Type:</strong> {selectedJob.jobType}</p>
                <p><strong>Active:</strong> {(selectedJob.active ?? selectedJob.isActive) ? 'Yes' : 'No'}</p>
              </div>
            )}

            {!detailLoading && !selectedJob && (
              <div className="service-details">No details available.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
