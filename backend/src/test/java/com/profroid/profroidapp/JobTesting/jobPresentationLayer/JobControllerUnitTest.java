package com.profroid.profroidapp.JobTesting.jobPresentationLayer;

import com.profroid.profroidapp.jobssubdomain.businessLayer.JobService;
import com.profroid.profroidapp.jobssubdomain.dataAccessLayer.JobType;
import com.profroid.profroidapp.jobssubdomain.presentationLayer.JobController;
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

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class JobControllerUnitTest {

    @InjectMocks
    private JobController jobController;

    @Mock
    private JobService jobService;

    private final String VALID_JOB_ID = "j1234567-abcd-4f42-9911-abcdef123456";
    private final String INVALID_JOB_ID = "invalid-id";
    private final String NON_EXISTING_JOB_ID = "00000000-abcd-4f42-9999-abcdef999999";

    private JobRequestModel validJobRequest;
    private JobResponseModel validJobResponse;

    @BeforeEach
    void setUp() {
        // Request
        validJobRequest = JobRequestModel.builder()
                .jobName("HVAC Installation")
                .jobDescription("Complete HVAC system installation")
                .hourlyRate(75.00)
                .estimatedDurationMinutes(240)
                .jobType(JobType.INSTALLATION)
                .active(true)
                .build();

        // Response
        validJobResponse = JobResponseModel.builder()
                .jobId(VALID_JOB_ID)
                .jobName("HVAC Installation")
                .jobDescription("Complete HVAC system installation")
                .hourlyRate(75.00)
                .estimatedDurationMinutes(240)
                .jobType(JobType.INSTALLATION)
                .active(true)
                .build();
    }

    // ============================================================
    // GET ALL JOBS
    // ============================================================

    @Test
    void whenGetAllJobs_withExistingJobs_thenReturnJobList() {
        List<JobResponseModel> expectedList =
                Arrays.asList(validJobResponse, validJobResponse);

        when(jobService.getAllJobs())
                .thenReturn(expectedList);

        ResponseEntity<List<JobResponseModel>> response =
                jobController.getAllJobs();

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(2, response.getBody().size());

        verify(jobService, times(1)).getAllJobs();
    }

    @Test
    void whenGetAllJobs_withNoJobs_thenReturnEmptyList() {
        when(jobService.getAllJobs())
                .thenReturn(Collections.emptyList());

        ResponseEntity<List<JobResponseModel>> response =
                jobController.getAllJobs();

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isEmpty());

        verify(jobService, times(1)).getAllJobs();
    }

    // ============================================================
    // GET JOB BY ID
    // ============================================================

    @Test
    void whenGetJobById_withValidId_thenReturnJob() {
        when(jobService.getJobById(VALID_JOB_ID))
                .thenReturn(validJobResponse);

        ResponseEntity<JobResponseModel> response =
                jobController.getJobById(VALID_JOB_ID);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(VALID_JOB_ID, response.getBody().getJobId());

        verify(jobService, times(1)).getJobById(VALID_JOB_ID);
    }

    @Test
    void whenGetJobById_withNonExistingId_thenThrowResourceNotFoundException() {
        when(jobService.getJobById(NON_EXISTING_JOB_ID))
                .thenThrow(new ResourceNotFoundException("Job not found"));

        assertThrows(ResourceNotFoundException.class,
                () -> jobController.getJobById(NON_EXISTING_JOB_ID));

        verify(jobService, times(1)).getJobById(NON_EXISTING_JOB_ID);
    }

    @Test
    void whenGetJobById_withInvalidId_thenThrowInvalidIdentifierException() {
        when(jobService.getJobById(INVALID_JOB_ID))
                .thenThrow(new InvalidIdentifierException("Invalid ID"));

        assertThrows(InvalidIdentifierException.class,
                () -> jobController.getJobById(INVALID_JOB_ID));

        verify(jobService, times(1)).getJobById(INVALID_JOB_ID);
    }

    // ============================================================
    // CREATE JOB
    // ============================================================

    @Test
    void whenCreateJob_withValidData_thenReturnCreatedJob() {
        when(jobService.createJob(any(JobRequestModel.class)))
                .thenReturn(validJobResponse);

        ResponseEntity<JobResponseModel> response =
                jobController.createJob(validJobRequest);

        assertNotNull(response);
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals("HVAC Installation", response.getBody().getJobName());

        verify(jobService, times(1))
                .createJob(any(JobRequestModel.class));
    }

    @Test
    void whenCreateJob_withDifferentJobType_thenReturnCreatedJob() {
        JobRequestModel maintenanceRequest = JobRequestModel.builder()
                .jobName("System Maintenance")
                .jobDescription("Regular maintenance check")
                .hourlyRate(60.00)
                .estimatedDurationMinutes(120)
                .jobType(JobType.MAINTENANCE)
                .active(true)
                .build();

        JobResponseModel maintenanceResponse = JobResponseModel.builder()
                .jobId(VALID_JOB_ID)
                .jobName("System Maintenance")
                .jobDescription("Regular maintenance check")
                .hourlyRate(60.00)
                .estimatedDurationMinutes(120)
                .jobType(JobType.MAINTENANCE)
                .active(true)
                .build();

        when(jobService.createJob(any(JobRequestModel.class)))
                .thenReturn(maintenanceResponse);

        ResponseEntity<JobResponseModel> response =
                jobController.createJob(maintenanceRequest);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals(JobType.MAINTENANCE, response.getBody().getJobType());

        verify(jobService, times(1))
                .createJob(any(JobRequestModel.class));
    }

    // ============================================================
    // UPDATE JOB
    // ============================================================

    @Test
    void whenUpdateJob_withValidData_thenReturnUpdatedJob() {
        JobRequestModel updateRequest = JobRequestModel.builder()
                .jobName("Updated HVAC Installation")
                .jobDescription("Updated description")
                .hourlyRate(85.00)
                .estimatedDurationMinutes(300)
                .jobType(JobType.INSTALLATION)
                .active(true)
                .build();

        JobResponseModel updatedResponse = JobResponseModel.builder()
                .jobId(VALID_JOB_ID)
                .jobName("Updated HVAC Installation")
                .jobDescription("Updated description")
                .hourlyRate(85.00)
                .estimatedDurationMinutes(300)
                .jobType(JobType.INSTALLATION)
                .active(true)
                .build();

        when(jobService.updateJob(eq(VALID_JOB_ID), any(JobRequestModel.class)))
                .thenReturn(updatedResponse);

        ResponseEntity<JobResponseModel> response =
                jobController.updateJob(VALID_JOB_ID, updateRequest);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Updated HVAC Installation", response.getBody().getJobName());

        verify(jobService, times(1))
                .updateJob(eq(VALID_JOB_ID), any(JobRequestModel.class));
    }

    @Test
    void whenUpdateJob_withNonExistingId_thenThrowResourceNotFoundException() {
        when(jobService.updateJob(eq(NON_EXISTING_JOB_ID), any()))
                .thenThrow(new ResourceNotFoundException("Job not found"));

        assertThrows(ResourceNotFoundException.class,
                () -> jobController.updateJob(NON_EXISTING_JOB_ID, validJobRequest));

        verify(jobService, times(1))
                .updateJob(eq(NON_EXISTING_JOB_ID), any());
    }

    @Test
    void whenUpdateJob_withInvalidId_thenThrowInvalidIdentifierException() {
        when(jobService.updateJob(eq(INVALID_JOB_ID), any()))
                .thenThrow(new InvalidIdentifierException("Invalid ID"));

        assertThrows(InvalidIdentifierException.class,
                () -> jobController.updateJob(INVALID_JOB_ID, validJobRequest));

        verify(jobService, times(1))
                .updateJob(eq(INVALID_JOB_ID), any());
    }

    // ============================================================
    // DEACTIVATE JOB
    // ============================================================

    @Test
    void whenDeactivateJob_withValidId_thenReturnDeactivatedJob() {
        JobResponseModel deactivatedResponse = JobResponseModel.builder()
                .jobId(VALID_JOB_ID)
                .jobName("HVAC Installation")
                .active(false)
                .build();

        when(jobService.deactivateJob(VALID_JOB_ID))
                .thenReturn(deactivatedResponse);

        ResponseEntity<JobResponseModel> response =
                jobController.deactivateJob(VALID_JOB_ID);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertFalse(response.getBody().isActive());

        verify(jobService, times(1)).deactivateJob(VALID_JOB_ID);
    }

    @Test
    void whenDeactivateJob_withInvalidId_thenThrowInvalidIdentifierException() {
        when(jobService.deactivateJob(INVALID_JOB_ID))
                .thenThrow(new InvalidIdentifierException("Invalid ID"));

        assertThrows(InvalidIdentifierException.class,
                () -> jobController.deactivateJob(INVALID_JOB_ID));

        verify(jobService, times(1)).deactivateJob(INVALID_JOB_ID);
    }

    @Test
    void whenDeactivateJob_withNonExistingId_thenThrowResourceNotFoundException() {
        when(jobService.deactivateJob(NON_EXISTING_JOB_ID))
                .thenThrow(new ResourceNotFoundException("Job not found"));

        assertThrows(ResourceNotFoundException.class,
                () -> jobController.deactivateJob(NON_EXISTING_JOB_ID));

        verify(jobService, times(1)).deactivateJob(NON_EXISTING_JOB_ID);
    }

    @Test
    void whenDeactivateJob_alreadyDeactivated_thenThrowInvalidOperationException() {
        when(jobService.deactivateJob(VALID_JOB_ID))
                .thenThrow(new InvalidOperationException("Job already deactivated"));

        assertThrows(InvalidOperationException.class,
                () -> jobController.deactivateJob(VALID_JOB_ID));

        verify(jobService, times(1)).deactivateJob(VALID_JOB_ID);
    }

    // ============================================================
    // REACTIVATE JOB
    // ============================================================

    @Test
    void whenReactivateJob_withValidId_thenReturnReactivatedJob() {
        JobResponseModel reactivatedResponse = JobResponseModel.builder()
                .jobId(VALID_JOB_ID)
                .jobName("HVAC Installation")
                .active(true)
                .build();

        when(jobService.reactivateJob(VALID_JOB_ID))
                .thenReturn(reactivatedResponse);

        ResponseEntity<JobResponseModel> response =
                jobController.reactivateJob(VALID_JOB_ID);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isActive());

        verify(jobService, times(1)).reactivateJob(VALID_JOB_ID);
    }

    @Test
    void whenReactivateJob_withInvalidId_thenThrowInvalidIdentifierException() {
        when(jobService.reactivateJob(INVALID_JOB_ID))
                .thenThrow(new InvalidIdentifierException("Invalid ID"));

        assertThrows(InvalidIdentifierException.class,
                () -> jobController.reactivateJob(INVALID_JOB_ID));

        verify(jobService, times(1)).reactivateJob(INVALID_JOB_ID);
    }

    @Test
    void whenReactivateJob_withNonExistingId_thenThrowResourceNotFoundException() {
        when(jobService.reactivateJob(NON_EXISTING_JOB_ID))
                .thenThrow(new ResourceNotFoundException("Job not found"));

        assertThrows(ResourceNotFoundException.class,
                () -> jobController.reactivateJob(NON_EXISTING_JOB_ID));

        verify(jobService, times(1)).reactivateJob(NON_EXISTING_JOB_ID);
    }

    @Test
    void whenReactivateJob_alreadyActive_thenThrowInvalidOperationException() {
        when(jobService.reactivateJob(VALID_JOB_ID))
                .thenThrow(new InvalidOperationException("Job already active"));

        assertThrows(InvalidOperationException.class,
                () -> jobController.reactivateJob(VALID_JOB_ID));

        verify(jobService, times(1)).reactivateJob(VALID_JOB_ID);
    }
}
