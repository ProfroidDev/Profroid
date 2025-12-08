package com.profroid.profroidapp.JobTesting.jobBusinessLayer;

import com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.AppointmentRepository;
import com.profroid.profroidapp.jobssubdomain.businessLayer.JobServiceImpl;
import com.profroid.profroidapp.jobssubdomain.dataAccessLayer.Job;
import com.profroid.profroidapp.jobssubdomain.dataAccessLayer.JobIdentifier;
import com.profroid.profroidapp.jobssubdomain.dataAccessLayer.JobRepository;
import com.profroid.profroidapp.jobssubdomain.dataAccessLayer.JobType;
import com.profroid.profroidapp.jobssubdomain.mappingLayer.JobRequestMapper;
import com.profroid.profroidapp.jobssubdomain.mappingLayer.JobResponseMapper;
import com.profroid.profroidapp.jobssubdomain.presentationLayer.JobRequestModel;
import com.profroid.profroidapp.jobssubdomain.presentationLayer.JobResponseModel;
import com.profroid.profroidapp.utils.exceptions.InvalidIdentifierException;
import com.profroid.profroidapp.utils.exceptions.InvalidOperationException;
import com.profroid.profroidapp.utils.exceptions.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class JobServiceUnitTest {

    @Mock
    private JobRepository jobRepository;
    @Mock
    private JobResponseMapper jobResponseMapper;
    @Mock
    private JobRequestMapper jobRequestMapper;

    @Mock
    private AppointmentRepository appointmentRepository;

    @InjectMocks
    private JobServiceImpl jobService;

    private final String VALID_JOB_ID = "00000000-0000-0000-0000-000000000000";
    private final String INVALID_JOB_ID = "invalid-id";
    private final String NON_EXISTING_JOB_ID = "11111111-1111-1111-1111-111111111111";

    private Job existingJob;
    private JobResponseModel existingJobResponse;
    private JobRequestModel validRequest;

    @BeforeEach
    void setup() {
        existingJob = new Job();
        existingJob.setJobIdentifier(new JobIdentifier(VALID_JOB_ID));
        existingJob.setJobName("HVAC Installation");
        existingJob.setJobDescription("Complete HVAC system installation");
        existingJob.setHourlyRate(75.00);
        existingJob.setEstimatedDurationMinutes(240);
        existingJob.setJobType(JobType.INSTALLATION);
        existingJob.setActive(true);

        existingJobResponse = JobResponseModel.builder()
                .jobId(VALID_JOB_ID)
                .jobName("HVAC Installation")
                .jobDescription("Complete HVAC system installation")
                .hourlyRate(75.00)
                .estimatedDurationMinutes(240)
                .jobType(JobType.INSTALLATION)
                .active(true)
                .build();

        validRequest = JobRequestModel.builder()
                .jobName("HVAC Installation")
                .jobDescription("Complete HVAC system installation")
                .hourlyRate(75.00)
                .estimatedDurationMinutes(240)
                .jobType(JobType.INSTALLATION)
                .active(true)
                .build();
    }

    // [Job-Service][Unit Test][Positive] Get all jobs -> returns list
    @Test
    void getAllJobs_returnsList() {
        when(jobRepository.findAll()).thenReturn(Arrays.asList(existingJob, existingJob));
        when(jobResponseMapper.toResponseModelList(any(List.class)))
                .thenReturn(Arrays.asList(existingJobResponse, existingJobResponse));

        List<JobResponseModel> result = jobService.getAllJobs();
        assertEquals(2, result.size());
        verify(jobRepository).findAll();
        verify(jobResponseMapper).toResponseModelList(any(List.class));
    }

    // [Job-Service][Unit Test][Positive] Get job by ID (valid) -> returns job
    @Test
    void getJobById_valid_returnsJob() {
        when(jobRepository.findJobByJobIdentifier_JobId(VALID_JOB_ID))
                .thenReturn(existingJob);
        when(jobResponseMapper.toResponseModel(any(Job.class)))
                .thenReturn(existingJobResponse);

        JobResponseModel response = jobService.getJobById(VALID_JOB_ID);
        assertEquals(VALID_JOB_ID, response.getJobId());
        assertEquals("HVAC Installation", response.getJobName());
        verify(jobRepository).findJobByJobIdentifier_JobId(VALID_JOB_ID);
    }

    // [Job-Service][Unit Test][Negative] Get job by ID (invalid) -> throws InvalidIdentifierException
    @Test
    void getJobById_invalid_throwsInvalidIdentifier() {
        assertThrows(InvalidIdentifierException.class,
                () -> jobService.getJobById(INVALID_JOB_ID));
        verify(jobRepository, never()).findJobByJobIdentifier_JobId(anyString());
    }

    // [Job-Service][Unit Test][Negative] Get job by ID (not found) -> throws ResourceNotFoundException
    @Test
    void getJobById_notFound_throwsResourceNotFound() {
        when(jobRepository.findJobByJobIdentifier_JobId(NON_EXISTING_JOB_ID))
                .thenReturn(null);
        assertThrows(ResourceNotFoundException.class,
                () -> jobService.getJobById(NON_EXISTING_JOB_ID));
        verify(jobRepository).findJobByJobIdentifier_JobId(NON_EXISTING_JOB_ID);
    }

    // [Job-Service][Unit Test][Positive] Create job with valid data -> succeeds
    @Test
    void createJob_validData_succeeds() {
        when(jobRequestMapper.toEntity(any(JobRequestModel.class), any(JobIdentifier.class)))
                .thenReturn(existingJob);
        when(jobRepository.save(any(Job.class))).thenReturn(existingJob);
        when(jobResponseMapper.toResponseModel(existingJob)).thenReturn(existingJobResponse);

        JobResponseModel response = jobService.createJob(validRequest);
        assertEquals(VALID_JOB_ID, response.getJobId());
        assertEquals("HVAC Installation", response.getJobName());
        verify(jobRequestMapper).toEntity(any(JobRequestModel.class), any(JobIdentifier.class));
        verify(jobRepository).save(any(Job.class));
        verify(jobResponseMapper).toResponseModel(existingJob);
    }

    // [Job-Service][Unit Test][Positive] Update job with valid data -> succeeds
    @Test
    void updateJob_validData_succeeds() {
        // Arrange
        when(jobRepository.findJobByJobIdentifier_JobId(VALID_JOB_ID))
                .thenReturn(existingJob);

        // No appointments for this job -> validation passes
        when(appointmentRepository.findAllByJob(existingJob))
                .thenReturn(List.of());

        JobRequestModel updateRequest = JobRequestModel.builder()
                .jobName("Updated HVAC Installation")
                .jobDescription("Updated description")
                .hourlyRate(85.00)
                .estimatedDurationMinutes(300)
                .jobType(JobType.MAINTENANCE)
                .active(true)
                .build();

        Job updatedJob = new Job();
        updatedJob.setJobIdentifier(new JobIdentifier(VALID_JOB_ID));
        updatedJob.setJobName("Updated HVAC Installation");
        updatedJob.setJobDescription("Updated description");
        updatedJob.setHourlyRate(85.00);
        updatedJob.setEstimatedDurationMinutes(300);
        updatedJob.setJobType(JobType.MAINTENANCE);
        updatedJob.setActive(true);

        when(jobRepository.save(any(Job.class))).thenReturn(updatedJob);

        JobResponseModel updatedResponse = JobResponseModel.builder()
                .jobId(VALID_JOB_ID)
                .jobName("Updated HVAC Installation")
                .jobDescription("Updated description")
                .hourlyRate(85.00)
                .estimatedDurationMinutes(300)
                .jobType(JobType.MAINTENANCE)
                .active(true)
                .build();

        when(jobResponseMapper.toResponseModel(updatedJob)).thenReturn(updatedResponse);

        // Act
        JobResponseModel response = jobService.updateJob(VALID_JOB_ID, updateRequest);

        // Assert
        assertEquals("Updated HVAC Installation", response.getJobName());
        assertEquals(85.00, response.getHourlyRate());
        assertEquals(JobType.MAINTENANCE, response.getJobType());

        verify(jobRepository).findJobByJobIdentifier_JobId(VALID_JOB_ID);
        verify(appointmentRepository).findAllByJob(existingJob);   // optional but nice
        verify(jobRepository).save(any(Job.class));
        verify(jobResponseMapper).toResponseModel(updatedJob);
    }

    // [Job-Service][Unit Test][Negative] Update job with invalid ID -> throws InvalidIdentifierException
    @Test
    void updateJob_invalidId_throwsInvalidIdentifier() {
        assertThrows(InvalidIdentifierException.class,
                () -> jobService.updateJob(INVALID_JOB_ID, validRequest));
        verify(jobRepository, never()).findJobByJobIdentifier_JobId(anyString());
    }

    // [Job-Service][Unit Test][Negative] Update job with non-existing ID -> throws ResourceNotFoundException
    @Test
    void updateJob_notFound_throwsResourceNotFound() {
        when(jobRepository.findJobByJobIdentifier_JobId(NON_EXISTING_JOB_ID))
                .thenReturn(null);
        assertThrows(ResourceNotFoundException.class,
                () -> jobService.updateJob(NON_EXISTING_JOB_ID, validRequest));
        verify(jobRepository).findJobByJobIdentifier_JobId(NON_EXISTING_JOB_ID);
        verify(jobRepository, never()).save(any());
    }

    // [Job-Service][Unit Test][Positive] Deactivate job -> succeeds
    @Test
    void deactivateJob_valid_succeeds() {
        when(jobRepository.findJobByJobIdentifier_JobId(VALID_JOB_ID))
                .thenReturn(existingJob);

        Job deactivated = new Job();
        deactivated.setJobIdentifier(new JobIdentifier(VALID_JOB_ID));
        deactivated.setActive(false);
        when(jobRepository.save(any(Job.class))).thenReturn(deactivated);

        JobResponseModel deactivatedResponse = JobResponseModel.builder()
                .jobId(VALID_JOB_ID)
                .active(false)
                .build();
        when(jobResponseMapper.toResponseModel(deactivated)).thenReturn(deactivatedResponse);

        JobResponseModel response = jobService.deactivateJob(VALID_JOB_ID);
        assertFalse(response.isActive());
        verify(jobRepository).findJobByJobIdentifier_JobId(VALID_JOB_ID);
        verify(jobRepository).save(any(Job.class));
    }

    // [Job-Service][Unit Test][Negative] Deactivate job with invalid ID -> throws InvalidIdentifierException
    @Test
    void deactivateJob_invalidId_throwsInvalidIdentifier() {
        assertThrows(InvalidIdentifierException.class,
                () -> jobService.deactivateJob(INVALID_JOB_ID));
        verify(jobRepository, never()).findJobByJobIdentifier_JobId(anyString());
    }

    // [Job-Service][Unit Test][Negative] Deactivate job not found -> throws ResourceNotFoundException
    @Test
    void deactivateJob_notFound_throwsResourceNotFound() {
        when(jobRepository.findJobByJobIdentifier_JobId(NON_EXISTING_JOB_ID))
                .thenReturn(null);
        assertThrows(ResourceNotFoundException.class,
                () -> jobService.deactivateJob(NON_EXISTING_JOB_ID));
        verify(jobRepository).findJobByJobIdentifier_JobId(NON_EXISTING_JOB_ID);
        verify(jobRepository, never()).save(any());
    }

    // [Job-Service][Unit Test][Negative] Deactivate already deactivated job -> throws InvalidOperationException
    @Test
    void deactivateJob_alreadyDeactivated_throwsInvalidOperation() {
        existingJob.setActive(false);
        when(jobRepository.findJobByJobIdentifier_JobId(VALID_JOB_ID))
                .thenReturn(existingJob);
        assertThrows(InvalidOperationException.class,
                () -> jobService.deactivateJob(VALID_JOB_ID));
        verify(jobRepository).findJobByJobIdentifier_JobId(VALID_JOB_ID);
        verify(jobRepository, never()).save(any());
    }

    // [Job-Service][Unit Test][Positive] Reactivate job -> succeeds
    @Test
    void reactivateJob_valid_succeeds() {
        existingJob.setActive(false);
        when(jobRepository.findJobByJobIdentifier_JobId(VALID_JOB_ID))
                .thenReturn(existingJob);

        Job reactivated = new Job();
        reactivated.setJobIdentifier(new JobIdentifier(VALID_JOB_ID));
        reactivated.setActive(true);
        when(jobRepository.save(any(Job.class))).thenReturn(reactivated);

        JobResponseModel reactivatedResponse = JobResponseModel.builder()
                .jobId(VALID_JOB_ID)
                .active(true)
                .build();
        when(jobResponseMapper.toResponseModel(reactivated)).thenReturn(reactivatedResponse);

        JobResponseModel response = jobService.reactivateJob(VALID_JOB_ID);
        assertTrue(response.isActive());
        verify(jobRepository).findJobByJobIdentifier_JobId(VALID_JOB_ID);
        verify(jobRepository).save(any(Job.class));
    }

    // [Job-Service][Unit Test][Negative] Reactivate job with invalid ID -> throws InvalidIdentifierException
    @Test
    void reactivateJob_invalidId_throwsInvalidIdentifier() {
        assertThrows(InvalidIdentifierException.class,
                () -> jobService.reactivateJob(INVALID_JOB_ID));
        verify(jobRepository, never()).findJobByJobIdentifier_JobId(anyString());
    }

    // [Job-Service][Unit Test][Negative] Reactivate job not found -> throws ResourceNotFoundException
    @Test
    void reactivateJob_notFound_throwsResourceNotFound() {
        when(jobRepository.findJobByJobIdentifier_JobId(NON_EXISTING_JOB_ID))
                .thenReturn(null);
        assertThrows(ResourceNotFoundException.class,
                () -> jobService.reactivateJob(NON_EXISTING_JOB_ID));
        verify(jobRepository).findJobByJobIdentifier_JobId(NON_EXISTING_JOB_ID);
        verify(jobRepository, never()).save(any());
    }

    // [Job-Service][Unit Test][Negative] Reactivate already active job -> throws InvalidOperationException
    @Test
    void reactivateJob_alreadyActive_throwsInvalidOperation() {
        when(jobRepository.findJobByJobIdentifier_JobId(VALID_JOB_ID))
                .thenReturn(existingJob);
        assertThrows(InvalidOperationException.class,
                () -> jobService.reactivateJob(VALID_JOB_ID));
        verify(jobRepository).findJobByJobIdentifier_JobId(VALID_JOB_ID);
        verify(jobRepository, never()).save(any());
    }

    // [Job-Service][Unit Test][Positive] Create job with different job types -> succeeds
    @Test
    void createJob_differentJobTypes_succeeds() {
        JobType[] jobTypes = {JobType.QUOTATION, JobType.INSTALLATION, JobType.REPARATION, JobType.MAINTENANCE};

        for (JobType type : jobTypes) {
            JobRequestModel request = JobRequestModel.builder()
                    .jobName("Job " + type.name())
                    .jobDescription("Description for " + type.name())
                    .hourlyRate(75.00)
                    .estimatedDurationMinutes(120)
                    .jobType(type)
                    .active(true)
                    .build();

            Job job = new Job();
            job.setJobType(type);
            when(jobRequestMapper.toEntity(any(JobRequestModel.class), any(JobIdentifier.class)))
                    .thenReturn(job);
            when(jobRepository.save(any(Job.class))).thenReturn(job);

            JobResponseModel response = JobResponseModel.builder()
                    .jobType(type)
                    .build();
            when(jobResponseMapper.toResponseModel(job)).thenReturn(response);

            JobResponseModel result = jobService.createJob(request);
            assertEquals(type, result.getJobType());
        }

        verify(jobRepository, times(jobTypes.length)).save(any(Job.class));
    }

    // [Job-Service][Unit Test][Positive] Update job with all fields -> succeeds
    @Test
    void updateJob_allFields_succeeds() {
        // Existing job found in repo
        when(jobRepository.findJobByJobIdentifier_JobId(VALID_JOB_ID))
                .thenReturn(existingJob);

        // No existing appointments for this job → validation passes
        when(appointmentRepository.findAllByJob(existingJob))
                .thenReturn(List.of());

        JobRequestModel completeUpdate = JobRequestModel.builder()
                .jobName("Completely Updated Job")
                .jobDescription("Completely updated description")
                .hourlyRate(100.00)
                .estimatedDurationMinutes(360)
                .jobType(JobType.REPARATION)
                .active(false)
                .build();

        Job updated = new Job();
        updated.setJobIdentifier(new JobIdentifier(VALID_JOB_ID));
        updated.setJobName("Completely Updated Job");
        updated.setJobDescription("Completely updated description");
        updated.setHourlyRate(100.00);
        updated.setEstimatedDurationMinutes(360);
        updated.setJobType(JobType.REPARATION);
        updated.setActive(false);

        when(jobRepository.save(any(Job.class))).thenReturn(updated);

        JobResponseModel response = JobResponseModel.builder()
                .jobId(VALID_JOB_ID)
                .jobName("Completely Updated Job")
                .jobDescription("Completely updated description")
                .hourlyRate(100.00)
                .estimatedDurationMinutes(360)
                .jobType(JobType.REPARATION)
                .active(false)
                .build();
        when(jobResponseMapper.toResponseModel(updated)).thenReturn(response);

        // Act
        JobResponseModel result = jobService.updateJob(VALID_JOB_ID, completeUpdate);

        // Assert
        assertEquals("Completely Updated Job", result.getJobName());
        assertEquals("Completely updated description", result.getJobDescription());
        assertEquals(100.00, result.getHourlyRate());
        assertEquals(360, result.getEstimatedDurationMinutes());
        assertEquals(JobType.REPARATION, result.getJobType());
        assertFalse(result.isActive());

        verify(jobRepository).findJobByJobIdentifier_JobId(VALID_JOB_ID);
        verify(appointmentRepository).findAllByJob(existingJob);  // optional but good
        verify(jobRepository).save(any(Job.class));
        verify(jobResponseMapper).toResponseModel(updated);
    }


    @Test
    void calculateRequiredSlots_shortAndLongDurations() throws Exception {
        var method = JobServiceImpl.class.getDeclaredMethod("calculateRequiredSlots", int.class);
        method.setAccessible(true);

        int resultShort = (int) method.invoke(jobService, 60);
        int resultLong = (int) method.invoke(jobService, 150);

        assertEquals(1, resultShort);  // ≤90 → 1 slot
        assertEquals(3, resultLong);   // ceil(150 / 60) = 3
    }

    @Test
    void hourToSlotIndex_allCases() throws Exception {
        var method = JobServiceImpl.class.getDeclaredMethod("hourToSlotIndex", int.class);
        method.setAccessible(true);

        assertEquals(0, method.invoke(jobService, 9));
        assertEquals(1, method.invoke(jobService, 11));
        assertEquals(2, method.invoke(jobService, 13));
        assertEquals(3, method.invoke(jobService, 15));
        assertEquals(4, method.invoke(jobService, 17));
        assertEquals(-1, method.invoke(jobService, 8)); // default branch
    }

    @Test
    void getOccupiedSlotIndices_returnsCorrectSlots() throws Exception {
        var method = JobServiceImpl.class.getDeclaredMethod("getOccupiedSlotIndices", int.class, int.class);
        method.setAccessible(true);

        int[] slots = (int[]) method.invoke(jobService, 9, 3); // 9h → index 0 → [0,1,2]
        assertArrayEquals(new int[]{0, 1, 2}, slots);
    }

    @Test
    void resolveDurationMinutes_handlesAllCases() throws Exception {
        var method = JobServiceImpl.class.getDeclaredMethod("resolveDurationMinutes", Job.class);
        method.setAccessible(true);

        Job jobWithDuration = new Job();
        jobWithDuration.setEstimatedDurationMinutes(200);
        assertEquals(200, method.invoke(jobService, jobWithDuration));

        for (var type : JobType.values()) {
            Job j = new Job();
            j.setJobType(type);
            j.setEstimatedDurationMinutes(null);
            int minutes = (int) method.invoke(jobService, j);
            switch (type) {
                case QUOTATION -> assertEquals(30, minutes);
                case MAINTENANCE -> assertEquals(60, minutes);
                case REPARATION -> assertEquals(90, minutes);
                case INSTALLATION -> assertEquals(240, minutes);
            }
        }
    }

    @Test
    void timeSlotsOverlap_detectsOverlapAndNonOverlap() throws Exception {
        var method = JobServiceImpl.class.getDeclaredMethod(
                "timeSlotsOverlap", int.class, int.class, int.class, int.class);
        method.setAccessible(true);

        // Overlapping: both start at 9 with 2 slots each
        assertTrue((boolean) method.invoke(jobService, 9, 2, 9, 2));

        // Non-overlapping: 9→10 vs 15→16
        assertFalse((boolean) method.invoke(jobService, 9, 1, 15, 1));
    }


    // [Job-Service][Unit Test][Negative] Update job – new duration exceeds working hours for existing appointment
    @Test
    void updateJob_durationExceedsWorkingHours_throwsInvalidOperation() {
        // Arrange: existing job is found
        when(jobRepository.findJobByJobIdentifier_JobId(VALID_JOB_ID))
                .thenReturn(existingJob);

        // Single appointment at 17:00 (slot index 4)
        var appt = mock(com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.Appointment.class);
        java.time.LocalDateTime dt = java.time.LocalDateTime.of(2025, 1, 1, 17, 0);
        when(appt.getAppointmentDate()).thenReturn(dt);

        // This job has exactly this appointment
        when(appointmentRepository.findAllByJob(existingJob))
                .thenReturn(List.of(appt));

        // New duration: 180 minutes = 3 hours → 3 slots
        // 17h → slot index 4, so 4 + 3 = 7 > 5 → exceeds working hours
        JobRequestModel updateRequest = JobRequestModel.builder()
                .jobName(existingJob.getJobName())
                .jobDescription(existingJob.getJobDescription())
                .hourlyRate(existingJob.getHourlyRate())
                .estimatedDurationMinutes(180)  // long enough to overflow
                .jobType(existingJob.getJobType())
                .active(existingJob.isActive())
                .build();

        // Act + Assert: the "day capacity" check should throw before any overlap logic
        assertThrows(InvalidOperationException.class,
                () -> jobService.updateJob(VALID_JOB_ID, updateRequest));

        // Verify we only hit the first level of validation
        verify(jobRepository).findJobByJobIdentifier_JobId(VALID_JOB_ID);
        verify(appointmentRepository).findAllByJob(existingJob);
        verify(appointmentRepository, never())
                .findByTechnicianAndDateAndScheduled(any(), any());
        verify(jobRepository, never()).save(any());
    }

    // [Job-Service][Unit Test][Negative] Update job – new duration overlaps with another same-day appointment
    @Test
    void updateJob_overlapWithSameDayAppointment_throwsInvalidOperation() {
        // Existing job found
        when(jobRepository.findJobByJobIdentifier_JobId(VALID_JOB_ID))
                .thenReturn(existingJob);

        // Target appointment at 09:00
        var appt1 = mock(com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.Appointment.class);
        // Another appointment at 11:00 (same technician & date)
        var appt2 = mock(com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.Appointment.class);

        // IDs so appt1 != appt2 (continue will only skip appt1 as "self")
        when(appt1.getId()).thenReturn(1);
        when(appt2.getId()).thenReturn(2);

        var date = java.time.LocalDate.of(2025, 1, 1);
        var dt1 = date.atTime(9, 0);   // 9h -> slot index 0
        var dt2 = date.atTime(11, 0);  // 11h -> slot index 1

        when(appt1.getAppointmentDate()).thenReturn(dt1);
        when(appt2.getAppointmentDate()).thenReturn(dt2);

        // Target technician (we don't care about the actual value, so null is fine)
        when(appt1.getTechnician()).thenReturn(null);

        // First query: appointments for this job
        when(appointmentRepository.findAllByJob(existingJob))
                .thenReturn(java.util.List.of(appt1));

        // Second query: same-day appointments for that technician and date
        // Returns both target (appt1) and another appointment (appt2)
        when(appointmentRepository.findByTechnicianAndDateAndScheduled(any(), any()))
                .thenReturn(java.util.List.of(appt1, appt2));

        // "Other" appointment's job (must not be null)
        Job otherJob = new Job();
        otherJob.setEstimatedDurationMinutes(60);           // 60 min → 1 slot
        otherJob.setJobType(JobType.MAINTENANCE);
        when(appt2.getJob()).thenReturn(otherJob);

        // Update request: new duration 180 min → 3 slots
        // Target at 9:00 → slots [0,1,2]
        // Other at 11:00 with 1 slot → [1] → overlap ⇒ InvalidOperationException
        JobRequestModel updateRequest = JobRequestModel.builder()
                .jobName(existingJob.getJobName())
                .jobDescription(existingJob.getJobDescription())
                .hourlyRate(existingJob.getHourlyRate())
                .estimatedDurationMinutes(180)    // long job
                .jobType(existingJob.getJobType())
                .active(existingJob.isActive())
                .build();

        // Act + Assert
        assertThrows(InvalidOperationException.class,
                () -> jobService.updateJob(VALID_JOB_ID, updateRequest));

        verify(appointmentRepository).findAllByJob(existingJob);
        verify(appointmentRepository).findByTechnicianAndDateAndScheduled(any(), any());
        verify(jobRepository, never()).save(any());
    }
}
