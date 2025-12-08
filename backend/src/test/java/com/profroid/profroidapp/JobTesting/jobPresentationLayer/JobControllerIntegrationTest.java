package com.profroid.profroidapp.JobTesting.jobPresentationLayer;

import com.profroid.profroidapp.jobssubdomain.dataAccessLayer.Job;
import com.profroid.profroidapp.jobssubdomain.dataAccessLayer.JobIdentifier;
import com.profroid.profroidapp.jobssubdomain.dataAccessLayer.JobRepository;
import com.profroid.profroidapp.jobssubdomain.dataAccessLayer.JobType;
import com.profroid.profroidapp.jobssubdomain.presentationLayer.JobRequestModel;
import com.profroid.profroidapp.jobssubdomain.presentationLayer.JobResponseModel;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.reactive.server.WebTestClient;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.boot.test.context.SpringBootTest.WebEnvironment.RANDOM_PORT;

@SpringBootTest(webEnvironment = RANDOM_PORT)
public class JobControllerIntegrationTest {

    @Autowired
    private WebTestClient webTestClient;

    @Autowired
    private JobRepository jobRepository;

    private Job testJob;
    private String testJobId;

    @BeforeEach
    void setup() {
        jobRepository.deleteAll();

        // Build base test job
        testJob = new Job();
        testJob.setJobIdentifier(new JobIdentifier());
        testJob.setJobName("HVAC Installation");
        testJob.setJobDescription("Complete HVAC system installation");
        testJob.setHourlyRate(75.00);
        testJob.setEstimatedDurationMinutes(240);
        testJob.setJobType(JobType.INSTALLATION);
        testJob.setActive(true);

        Job saved = jobRepository.save(testJob);
        testJobId = saved.getJobIdentifier().getJobId();
    }

    @AfterEach
    void cleanup() {
        jobRepository.deleteAll();
    }

    // ================================================================
    // GET ALL JOBS
    // ================================================================
    @Test
    void whenGetAllJobs_thenReturnsList() {
        webTestClient.get()
                .uri("/api/v1/jobs")
                .exchange()
                .expectStatus().isOk()
                .expectHeader().contentType(MediaType.APPLICATION_JSON)
                .expectBodyList(JobResponseModel.class)
                .value(jobs -> {
                    assertNotNull(jobs);
                    assertEquals(1, jobs.size());
                    assertEquals("HVAC Installation", jobs.get(0).getJobName());
                });
    }

    @Test
    void whenGetAllJobs_withNoData_thenReturnsEmptyList() {
        jobRepository.deleteAll();

        webTestClient.get()
                .uri("/api/v1/jobs")
                .exchange()
                .expectStatus().isOk()
                .expectBodyList(JobResponseModel.class)
                .value(jobs -> assertTrue(jobs.isEmpty()));
    }

    // ================================================================
    // GET JOB BY ID
    // ================================================================
    @Test
    void whenGetJobById_withValidId_thenReturnsJob() {
        webTestClient.get()
                .uri("/api/v1/jobs/{jobId}", testJobId)
                .exchange()
                .expectStatus().isOk()
                .expectBody(JobResponseModel.class)
                .value(job -> {
                    assertNotNull(job);
                    assertEquals(testJobId, job.getJobId());
                    assertEquals("HVAC Installation", job.getJobName());
                    assertEquals(75.00, job.getHourlyRate());
                });
    }

    @Test
    void whenGetJobById_withInvalidId_thenReturns422() {
        webTestClient.get()
                .uri("/api/v1/jobs/{jobId}", "bad-id")
                .exchange()
                .expectStatus().isEqualTo(422);
    }

    @Test
    void whenGetJobById_withNonExistingId_thenReturns404() {
        webTestClient.get()
                .uri("/api/v1/jobs/{jobId}",
                        "00000000-0000-0000-0000-000000000000")
                .exchange()
                .expectStatus().isNotFound();
    }

    // ================================================================
    // CREATE JOB
    // ================================================================
    @Test
    void whenCreateJob_withValidData_thenReturns201() {
        JobRequestModel request = JobRequestModel.builder()
                .jobName("System Maintenance")
                .jobDescription("Regular maintenance service")
                .hourlyRate(60.00)
                .estimatedDurationMinutes(120)
                .jobType(JobType.MAINTENANCE)
                .active(true)
                .build();

        webTestClient.post()
                .uri("/api/v1/jobs")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(JobResponseModel.class)
                .value(job -> {
                    assertNotNull(job);
                    assertNotNull(job.getJobId());
                    assertEquals("System Maintenance", job.getJobName());
                    assertEquals(60.00, job.getHourlyRate());
                    assertEquals(JobType.MAINTENANCE, job.getJobType());
                });
    }

    @Test
    void whenCreateJob_withDifferentJobTypes_thenReturns201() {
        JobRequestModel quotationRequest = JobRequestModel.builder()
                .jobName("Free Quotation")
                .jobDescription("Initial assessment")
                .hourlyRate(0.00)
                .estimatedDurationMinutes(30)
                .jobType(JobType.QUOTATION)
                .active(true)
                .build();

        webTestClient.post()
                .uri("/api/v1/jobs")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(quotationRequest)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(JobResponseModel.class)
                .value(job -> {
                    assertEquals(JobType.QUOTATION, job.getJobType());
                    assertEquals(0.00, job.getHourlyRate());
                });
    }

    // ================================================================
    // UPDATE JOB
    // ================================================================
    @Test
    void whenUpdateJob_withValidData_thenReturns200() {
        JobRequestModel updateRequest = JobRequestModel.builder()
                .jobName("Updated Installation")
                .jobDescription("Updated description")
                .hourlyRate(85.00)
                .estimatedDurationMinutes(300)
                .jobType(JobType.INSTALLATION)
                .active(true)
                .build();

        webTestClient.put()
                .uri("/api/v1/jobs/{jobId}", testJobId)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(updateRequest)
                .exchange()
                .expectStatus().isOk()
                .expectBody(JobResponseModel.class)
                .value(job -> {
                    assertEquals(testJobId, job.getJobId());
                    assertEquals("Updated Installation", job.getJobName());
                    assertEquals(85.00, job.getHourlyRate());
                });
    }

    @Test
    void whenUpdateJob_withInvalidId_thenReturns422() {
        JobRequestModel updateRequest = JobRequestModel.builder()
                .jobName("Updated Job")
                .jobDescription("Description")
                .hourlyRate(50.00)
                .estimatedDurationMinutes(120)
                .jobType(JobType.REPARATION)
                .active(true)
                .build();

        webTestClient.put()
                .uri("/api/v1/jobs/{jobId}", "bad-id")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(updateRequest)
                .exchange()
                .expectStatus().isEqualTo(422);
    }

    @Test
    void whenUpdateJob_withNonExistingId_thenReturns404() {
        JobRequestModel updateRequest = JobRequestModel.builder()
                .jobName("Updated Job")
                .jobDescription("Description")
                .hourlyRate(50.00)
                .estimatedDurationMinutes(120)
                .jobType(JobType.REPARATION)
                .active(true)
                .build();

        webTestClient.put()
                .uri("/api/v1/jobs/{jobId}", "00000000-0000-0000-0000-000000000000")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(updateRequest)
                .exchange()
                .expectStatus().isNotFound();
    }

    // ================================================================
    // DEACTIVATE JOB
    // ================================================================
    @Test
    void whenDeactivateJob_withValidId_thenReturns200AndJobIsDeactivated() {
        webTestClient.delete()
                .uri("/api/v1/jobs/{jobId}/deactivate", testJobId)
                .exchange()
                .expectStatus().isOk()
                .expectBody(JobResponseModel.class)
                .value(job -> {
                    assertEquals(testJobId, job.getJobId());
                    assertFalse(job.isActive());
                });

        // Verify in database
        Job found = jobRepository.findJobByJobIdentifier_JobId(testJobId);
        assertNotNull(found);
        assertFalse(found.isActive());
    }

    @Test
    void whenDeactivateJob_withInvalidId_thenReturns422() {
        webTestClient.delete()
                .uri("/api/v1/jobs/{jobId}/deactivate", "bad-id")
                .exchange()
                .expectStatus().isEqualTo(422);
    }

    @Test
    void whenDeactivateJob_withNonExistingId_thenReturns404() {
        webTestClient.delete()
                .uri("/api/v1/jobs/{jobId}/deactivate", "00000000-0000-0000-0000-000000000000")
                .exchange()
                .expectStatus().isNotFound();
    }

    @Test
    void whenDeactivateJob_alreadyDeactivated_thenReturns400() {
        // First deactivate – should succeed
        webTestClient.delete()
                .uri("/api/v1/jobs/{jobId}/deactivate", testJobId)
                .exchange()
                .expectStatus().isOk();

        // Try to deactivate again – should now fail with 400 Bad Request
        webTestClient.delete()
                .uri("/api/v1/jobs/{jobId}/deactivate", testJobId)
                .exchange()
                .expectStatus().isBadRequest()
                .expectBody(String.class)
                .value(body -> assertTrue(
                        body.contains("already deactivated"),
                        "Error message should indicate job is already deactivated"
                ));
    }


    // ================================================================
    // REACTIVATE JOB
    // ================================================================
    @Test
    void whenReactivateJob_withValidId_thenReturns200AndJobIsReactivated() {
        // First deactivate
        webTestClient.delete()
                .uri("/api/v1/jobs/{jobId}/deactivate", testJobId)
                .exchange()
                .expectStatus().isOk();

        // Then reactivate
        webTestClient.patch()
                .uri("/api/v1/jobs/{jobId}/reactivate", testJobId)
                .exchange()
                .expectStatus().isOk()
                .expectBody(JobResponseModel.class)
                .value(job -> {
                    assertEquals(testJobId, job.getJobId());
                    assertTrue(job.isActive());
                });

        // Verify in database
        Job found = jobRepository.findJobByJobIdentifier_JobId(testJobId);
        assertNotNull(found);
        assertTrue(found.isActive());
    }

    @Test
    void whenReactivateJob_withInvalidId_thenReturns422() {
        webTestClient.patch()
                .uri("/api/v1/jobs/{jobId}/reactivate", "bad-id")
                .exchange()
                .expectStatus().isEqualTo(422);
    }

    @Test
    void whenReactivateJob_withNonExistingId_thenReturns404() {
        webTestClient.patch()
                .uri("/api/v1/jobs/{jobId}/reactivate", "00000000-0000-0000-0000-000000000000")
                .exchange()
                .expectStatus().isNotFound();
    }

    @Test
    void whenReactivateJob_alreadyActive_thenReturns400() {
        webTestClient.patch()
                .uri("/api/v1/jobs/{jobId}/reactivate", testJobId)
                .exchange()
                .expectStatus().isBadRequest()
                .expectBody(String.class)
                .value(body -> assertTrue(
                        body.contains("already active"),
                        "Error message should indicate job is already active"
                ));
    }

}
