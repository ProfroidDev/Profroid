import React, { useEffect, useState } from "react";
import { getMyJobs } from "../../features/appointment/api/getMyJobs";
import type { AppointmentResponseModel } from "../../features/appointment/models/AppointmentResponseModel";
import Toast from "../../shared/components/Toast";
import { MapPin, Clock, User, Wrench, DollarSign, Phone, AlertCircle } from "lucide-react";
import "./MyJobsPage.css";

// Default test technician ID from backend
const DEFAULT_TECHNICIAN_ID = "a9e6d3f2-1c0a-4b5c-9d8e-7a6f5e4d3c2b"; // Bob Williams

export default function MyJobsPage(): React.ReactElement {
  const [jobs, setJobs] = useState<AppointmentResponseModel[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedJob, setSelectedJob] = useState<AppointmentResponseModel | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  
  // For testing: allow switching technician ID
  const [technicianId, setTechnicianId] = useState<string>(DEFAULT_TECHNICIAN_ID);
  const [showIdInput, setShowIdInput] = useState<boolean>(false);

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [technicianId]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const data = await getMyJobs(technicianId);
      setJobs(data);
    } catch (error: unknown) {
      console.error("Error fetching jobs:", error);
      setToast({
        message: "Failed to fetch jobs",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
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
    <div className="jobs-page-light">
      <div className="jobs-header">
        <h1 className="jobs-title-light">My Jobs</h1>
        {jobs.length > 0 && (
          <p className="user-name-display">Welcome, {jobs[0].technicianFirstName} {jobs[0].technicianLastName}</p>
        )}
        <p className="jobs-subtitle">Your assigned service appointments and work schedule</p>
        
        {/* Test ID Switcher */}
        <div className="test-switcher">
          <button 
            className="btn-toggle-id"
            onClick={() => setShowIdInput(!showIdInput)}
          >
            Technician Mode
          </button>
          
          {showIdInput && (
            <div className="id-input-container">
              <input
                type="text"
                value={technicianId}
                onChange={(e) => setTechnicianId(e.target.value)}
                placeholder="Enter Technician ID"
                className="id-input"
              />
              <button onClick={fetchJobs} className="btn-refresh">
                Refresh
              </button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading your jobs...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="empty-state">
          <Wrench size={64} strokeWidth={1.5} />
          <h3>No Jobs Assigned</h3>
          <p>You don't have any jobs scheduled at the moment.</p>
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
                <span>{formatDate(job.appointmentDate)}</span>
              </div>

              {/* Customer Info */}
              <div className="job-info-row">
                <User size={18} />
                <span>
                  Customer: {job.customerFirstName} {job.customerLastName}
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
                <span>Cellar: {job.cellarName}</span>
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
                <span>${job.hourlyRate.toFixed(2)}/hour</span>
              </div>

              {/* Description */}
              <div className="job-description">
                <AlertCircle size={16} />
                <p>{job.description}</p>
              </div>

              {/* View Details Button */}
              <button
                className="btn-view-details"
                onClick={() => setSelectedJob(job)}
              >
                View Full Details
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
              <h2>Job Details</h2>
              <button className="modal-close-light" onClick={() => setSelectedJob(null)}>
                &#10005;
              </button>
            </div>

            <div className="modal-content-light">
              <div className="detail-section">
                <h3>Service Information</h3>
                <p><strong>Job:</strong> {selectedJob.jobName}</p>
                <p><strong>Type:</strong> {selectedJob.jobType}</p>
                <p><strong>Rate:</strong> ${selectedJob.hourlyRate.toFixed(2)}/hour</p>
                <p><strong>Status:</strong> <span className={`modal-status-badge ${getStatusBadge(selectedJob.status)}`}>{selectedJob.status}</span></p>
              </div>

              <div className="detail-section">
                <h3>Scheduled Time</h3>
                <p>{formatDate(selectedJob.appointmentDate)}</p>
              </div>

              <div className="detail-section customer-highlight">
                <h3>Customer Information</h3>
                <p><strong>Name:</strong> {selectedJob.customerFirstName} {selectedJob.customerLastName}</p>
                {selectedJob.customerPhoneNumbers.map((phone, idx) => (
                  <p key={idx}><strong>{phone.type}:</strong> {phone.number}</p>
                ))}
              </div>

              <div className="detail-section">
                <h3>Cellar</h3>
                <p>{selectedJob.cellarName}</p>
              </div>

              <div className="detail-section">
                <h3>Service Location</h3>
                <p>{selectedJob.appointmentAddress.streetAddress}</p>
                <p>{selectedJob.appointmentAddress.city}, {selectedJob.appointmentAddress.province}</p>
                <p>{selectedJob.appointmentAddress.country} {selectedJob.appointmentAddress.postalCode}</p>
              </div>

              <div className="detail-section">
                <h3>Work Description</h3>
                <p>{selectedJob.description}</p>
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
    </div>
  );
}
