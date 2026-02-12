package com.profroid.profroidapp.jobssubdomain.businessLayer;

import com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.Appointment;
import com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.AppointmentRepository;
import com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.AppointmentStatusType;
import com.profroid.profroidapp.jobssubdomain.dataAccessLayer.Job;
import com.profroid.profroidapp.jobssubdomain.dataAccessLayer.JobIdentifier;
import com.profroid.profroidapp.jobssubdomain.dataAccessLayer.JobRepository;
import com.profroid.profroidapp.jobssubdomain.mappingLayer.JobRequestMapper;
import com.profroid.profroidapp.jobssubdomain.mappingLayer.JobResponseMapper;
import com.profroid.profroidapp.jobssubdomain.presentationLayer.JobRequestModel;
import com.profroid.profroidapp.jobssubdomain.presentationLayer.JobResponseModel;
import com.profroid.profroidapp.filesubdomain.businessLayer.FileService;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.FileCategory;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.FileOwnerType;
import com.profroid.profroidapp.utils.exceptions.InvalidOperationException;
import jakarta.persistence.EntityNotFoundException;
import com.profroid.profroidapp.utils.exceptions.InvalidIdentifierException;
import com.profroid.profroidapp.utils.exceptions.InvalidOperationException;
import com.profroid.profroidapp.utils.exceptions.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
public class JobServiceImpl implements JobService {

    private final JobRepository jobRepository;
    private final JobResponseMapper jobResponseMapper;
    private final JobRequestMapper jobRequestMapper;
    private final AppointmentRepository appointmentRepository;
    private final FileService fileService;

    public JobServiceImpl(JobRepository jobRepository,
                          JobResponseMapper jobResponseMapper,
                          JobRequestMapper jobRequestMapper,
                          AppointmentRepository appointmentRepository,
                          FileService fileService) {
        this.jobRepository = jobRepository;
        this.jobResponseMapper = jobResponseMapper;
        this.jobRequestMapper = jobRequestMapper;
        this.appointmentRepository = appointmentRepository;
        this.fileService = fileService;
    }

    @Override
    public List<JobResponseModel> getAllJobs() {
        List<Job> jobs = jobRepository.findAll();

        return jobResponseMapper.toResponseModelList(jobs);
    }

    @Override
    public JobResponseModel getJobById(String jobId) {
        if (jobId == null || jobId.trim().length() != 36) {
            throw new InvalidIdentifierException("Job ID must be a 36-character UUID string.");
        }

        Job foundJob = jobRepository.findJobByJobIdentifier_JobId(jobId);

        if (foundJob == null) {
            throw new ResourceNotFoundException("Job " + jobId + " not found.");
        }
        return jobResponseMapper.toResponseModel(foundJob);
    }

    @Override
    public JobResponseModel createJob(JobRequestModel requestModel) {
        JobIdentifier jobIdentifier = new JobIdentifier();
        Job job = jobRequestMapper.toEntity(requestModel, jobIdentifier);
        Job savedJob = jobRepository.save(job);
        return jobResponseMapper.toResponseModel(savedJob);
    }

    @Override
    public JobResponseModel updateJob(String jobId, JobRequestModel requestModel) {
        if (jobId == null || jobId.trim().length() != 36) {
            throw new InvalidIdentifierException("Job ID must be a 36-character UUID string.");
        }

        Job foundJob = jobRepository.findJobByJobIdentifier_JobId(jobId);

        if (foundJob == null) {
            throw new ResourceNotFoundException("Job " + jobId + " not found.");
        }

        // Update all job fields
        foundJob.setJobName(requestModel.getJobName());
        foundJob.setJobDescription(requestModel.getJobDescription());
        foundJob.setJobNameFr(requestModel.getJobNameFr());
        foundJob.setJobDescriptionFr(requestModel.getJobDescriptionFr());
        foundJob.setHourlyRate(requestModel.getHourlyRate());
        foundJob.setEstimatedDurationMinutes(requestModel.getEstimatedDurationMinutes());
        foundJob.setJobType(requestModel.getJobType());
        foundJob.setActive(requestModel.isActive());

        // Re-validate all existing appointments for this job with the new duration
        validateExistingAppointments(foundJob);

        Job updatedJob = jobRepository.save(foundJob);
        return jobResponseMapper.toResponseModel(updatedJob);
    }

    @Override
    public JobResponseModel deactivateJob(String jobId) {
        if (jobId == null || jobId.trim().length() != 36) {
            throw new InvalidIdentifierException("Job ID must be a 36-character UUID string.");
        }

        Job foundJob = jobRepository.findJobByJobIdentifier_JobId(jobId);

        if (foundJob == null) {
            throw new ResourceNotFoundException("Job " + jobId + " not found.");
        }

        if (!foundJob.isActive()) {
            throw new InvalidOperationException("Job " + jobId + " is already deactivated.");
        }

        foundJob.setActive(false);
        Job deactivatedJob = jobRepository.save(foundJob);
        return jobResponseMapper.toResponseModel(deactivatedJob);
    }


    private void validateExistingAppointments(Job updatedJob) {
        List<Appointment> appointments = appointmentRepository.findAllByJob(updatedJob);
        if (appointments.isEmpty()) {
            return; // nothing to validate
        }

        int updatedDurationMinutes = resolveDurationMinutes(updatedJob);
        int updatedSlots = calculateRequiredSlots(updatedDurationMinutes);

        for (Appointment target : appointments) {
            // Completed or cancelled appointments should not block job duration updates
            if (target.getAppointmentStatus() != null) {
                AppointmentStatusType status = target.getAppointmentStatus().getAppointmentStatusType();
                if (status == AppointmentStatusType.COMPLETED || status == AppointmentStatusType.CANCELLED) {
                    continue;
                }
            }
            LocalDate date = target.getAppointmentDate().toLocalDate();
            LocalTime startTime = target.getAppointmentDate().toLocalTime();
            int startHour = startTime.getHour();

            // Validate day capacity for the target appointment itself
            int startIndex = hourToSlotIndex(startHour);
            if (startIndex < 0 || startIndex + updatedSlots > 5) {
                throw new InvalidOperationException(
                    "Job duration update would exceed available working hours for appointment at " + startTime +
                    " on " + date + ". Choose an earlier time or shorten the duration."
                );
            }

            // Check if appointment would end after 5 PM
            LocalTime appointmentEnd = startTime.plusMinutes(updatedDurationMinutes);
            if (appointmentEnd.isAfter(LocalTime.of(17, 0))) {
                throw new InvalidOperationException(
                    "Job duration update would cause appointment to end at " + appointmentEnd + 
                    ", which exceeds the 5:00 PM working limit. Choose a shorter duration."
                );
            }

            // Fetch all scheduled/completed appointments for the same technician and date
            List<Appointment> sameDayAppointments = appointmentRepository.findByTechnicianAndDateAndScheduled(
                target.getTechnician(),
                date
            );

            for (Appointment other : sameDayAppointments) {
                if (other.getId().equals(target.getId())) {
                    continue; // skip self
                }

                if (other.getAppointmentStatus() != null) {
                    AppointmentStatusType otherStatus = other.getAppointmentStatus().getAppointmentStatusType();
                    if (otherStatus == AppointmentStatusType.COMPLETED || otherStatus == AppointmentStatusType.CANCELLED) {
                        continue; // completed/cancelled appointments do not block overlaps
                    }
                }

                int otherDuration = resolveDurationMinutes(other.getJob());
                LocalTime otherStartTime = other.getAppointmentDate().toLocalTime();

                if (timeSlotsOverlap(startTime, updatedDurationMinutes, otherStartTime, otherDuration)) {
                    LocalTime updatedEndTime = startTime.plusMinutes(updatedDurationMinutes);
                    LocalTime otherEndTime = otherStartTime.plusMinutes(otherDuration);
                    
                    throw new InvalidOperationException(
                        "Job duration update violates scheduling rules: appointment at " + startTime + 
                        " (ending at " + updatedEndTime + ") would overlap or be too close to another appointment at " +
                        otherStartTime + " (ending at " + otherEndTime + ") on " + date + 
                        ". A minimum 30-minute buffer is required between appointments. " +
                        "Adjust existing appointments or choose a shorter duration."
                    );
                }
            }
        }
    }

    private int resolveDurationMinutes(Job job) {
        Integer duration = job.getEstimatedDurationMinutes();
        if (duration != null) {
            return duration;
        }

        return switch (job.getJobType()) {
            case QUOTATION -> 30;
            case MAINTENANCE -> 60;
            case REPARATION -> 90;
            case INSTALLATION -> 240;
        };
    }

    private int calculateRequiredSlots(int durationMinutes) {
        // Business rule: Each slot is 2 hours (120 minutes)
        // Calculate how many 2-hour slots are needed
        // Examples:
        // - 30 min (QUOTATION) = 1 slot
        // - 60 min (MAINTENANCE) = 1 slot
        // - 90 min (REPARATION) = 1 slot
        // - 120 min = 1 slot
        // - 121-240 min = 2 slots
        // - 240 min (INSTALLATION) = 2 slots (exactly fits 13:00-17:00)
        // - 241-360 min = 3 slots
        final int MINUTES_PER_SLOT = 120;
        return (int) Math.ceil((double) durationMinutes / MINUTES_PER_SLOT);
    }

    private boolean timeSlotsOverlap(LocalTime startTime1, int durationMinutes1, LocalTime startTime2, int durationMinutes2) {
        // Calculate end times
        LocalTime endTime1 = startTime1.plusMinutes(durationMinutes1);
        LocalTime endTime2 = startTime2.plusMinutes(durationMinutes2);
        
        // Minimum buffer time between appointments (30 minutes)
        final int BUFFER_MINUTES = 30;
        
        // Check for direct overlap: two time ranges overlap if one starts before the other ends
        // and the other starts before the first ends
        boolean hasDirectOverlap = startTime1.isBefore(endTime2) && startTime2.isBefore(endTime1);
        
        if (hasDirectOverlap) {
            return true; // Direct overlap detected
        }
        
        // Allow back-to-back appointments (0 minute gap is OK)
        // Don't enforce 30-minute buffer here - let warnings handle it
        
        return false; // No actual overlap
    }

    private int[] getOccupiedSlotIndices(int startHour, int slots) {
        int startIndex = hourToSlotIndex(startHour);
        int[] occupied = new int[slots];
        for (int i = 0; i < slots; i++) {
            occupied[i] = startIndex + i;
        }
        return occupied;
    }

    private int hourToSlotIndex(int hour) {
        return switch (hour) {
            case 9 -> 0;
            case 11 -> 1;
            case 13 -> 2;
            case 15 -> 3;
            case 17 -> 4;
            default -> -1;
        };
    }

@Override
public JobResponseModel reactivateJob(String jobId) {
    if (jobId == null || jobId.trim().length() != 36) {
        throw new InvalidIdentifierException("Job ID must be a 36-character UUID string.");
    }
        Job foundJob = jobRepository.findJobByJobIdentifier_JobId(jobId);

        if (foundJob == null) {
            throw new ResourceNotFoundException("Job " + jobId + " not found.");
        }

        if (foundJob.isActive()) {
            throw new InvalidOperationException("Job " + jobId + " is already active.");
        }

        foundJob.setActive(true);
        Job reactivatedJob = jobRepository.save(foundJob);
        return jobResponseMapper.toResponseModel(reactivatedJob);
    }

    @Override
    @Transactional
    public JobResponseModel uploadJobImage(String jobId, org.springframework.web.multipart.MultipartFile file) {
        if (jobId == null || jobId.trim().length() != 36) {
            throw new com.profroid.profroidapp.utils.exceptions.InvalidIdentifierException("Job ID must be a 36-character UUID string.");
        }

        Job job = jobRepository.findJobByJobIdentifier_JobId(jobId);
        if (job == null) {
            throw new com.profroid.profroidapp.utils.exceptions.ResourceNotFoundException("Job " + jobId + " not found.");
        }

        java.util.UUID previousImageId = job.getImageFileId();
        java.util.UUID newImageId = null;

        try {
            // Upload new image first, within transaction context
            var stored = fileService.upload(file, FileOwnerType.JOB, jobId, FileCategory.IMAGE);
            newImageId = stored.getId();

            // Update job with new image ID
            job.setImageFileId(newImageId);
            Job saved = jobRepository.save(job);

            // Delete old image after successful save (best effort)
            if (previousImageId != null) {
                try {
                    fileService.delete(previousImageId);
                } catch (Exception e) {
                    // Log but don't fail transaction; old file will be orphaned but won't block the operation
                    System.err.println("Warning: Failed to delete previous image " + previousImageId + ": " + e.getMessage());
                }
            }

            return jobResponseMapper.toResponseModel(saved);
        } catch (Exception e) {
            // Compensating transaction: delete newly uploaded file if database save failed
            if (newImageId != null) {
                try {
                    fileService.delete(newImageId);
                    System.err.println("Compensating transaction: Deleted orphaned file " + newImageId);
                } catch (Exception deleteErr) {
                    System.err.println("Critical: Failed to delete orphaned file " + newImageId + " after upload failure: " + deleteErr.getMessage());
                }
            }
            // Re-throw original exception to maintain transactional semantics
            throw e;
        }
    }
}

