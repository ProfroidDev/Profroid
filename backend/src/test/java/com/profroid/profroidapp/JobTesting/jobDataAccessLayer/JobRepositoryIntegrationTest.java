package com.profroid.profroidapp.JobTesting.jobDataAccessLayer;

import com.profroid.profroidapp.jobssubdomain.dataAccessLayer.Job;
import com.profroid.profroidapp.jobssubdomain.dataAccessLayer.JobIdentifier;
import com.profroid.profroidapp.jobssubdomain.dataAccessLayer.JobRepository;
import com.profroid.profroidapp.jobssubdomain.dataAccessLayer.JobType;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
public class JobRepositoryIntegrationTest {

    @Autowired
    private JobRepository jobRepository;

    private Job buildJob(String jobName, JobType jobType) {
        Job job = new Job();
        job.setJobIdentifier(new JobIdentifier());
        job.setJobName(jobName);
        job.setJobDescription("Test job description for " + jobName);
        job.setHourlyRate(75.00);
        job.setEstimatedDurationMinutes(120);
        job.setJobType(jobType);
        job.setActive(true);
        return job;
    }

    // -------------------------------------------------------------------------
    // FIND BY JOB IDENTIFIER
    // -------------------------------------------------------------------------
    @Test
    void whenSaveJob_thenCanFindByJobIdentifier() {
        Job saved = jobRepository.save(buildJob("HVAC Installation", JobType.INSTALLATION));
        assertNotNull(saved.getId());

        String jobId = saved.getJobIdentifier().getJobId();
        assertNotNull(jobId);

        Job found = jobRepository.findJobByJobIdentifier_JobId(jobId);

        assertNotNull(found);
        assertEquals(jobId, found.getJobIdentifier().getJobId());
        assertEquals("HVAC Installation", found.getJobName());
    }

    // -------------------------------------------------------------------------
    // SAVE AND RETRIEVE
    // -------------------------------------------------------------------------
    @Test
    void whenSaveJob_thenAllFieldsArePersisted() {
        Job job = buildJob("System Maintenance", JobType.MAINTENANCE);
        job.setHourlyRate(60.50);
        job.setEstimatedDurationMinutes(180);
        job.setActive(true);

        Job saved = jobRepository.save(job);
        assertNotNull(saved.getId());

        Job found = jobRepository.findJobByJobIdentifier_JobId(
                saved.getJobIdentifier().getJobId());

        assertNotNull(found);
        assertEquals("System Maintenance", found.getJobName());
        assertEquals(60.50, found.getHourlyRate());
        assertEquals(180, found.getEstimatedDurationMinutes());
        assertEquals(JobType.MAINTENANCE, found.getJobType());
        assertTrue(found.isActive());
    }

    // -------------------------------------------------------------------------
    // DIFFERENT JOB TYPES
    // -------------------------------------------------------------------------
    @Test
    void whenSaveJobs_withDifferentTypes_thenAllArePersisted() {
        Job quotation = buildJob("Free Quotation", JobType.QUOTATION);
        Job installation = buildJob("HVAC Installation", JobType.INSTALLATION);
        Job reparation = buildJob("System Repair", JobType.REPARATION);
        Job maintenance = buildJob("Regular Maintenance", JobType.MAINTENANCE);

        jobRepository.save(quotation);
        jobRepository.save(installation);
        jobRepository.save(reparation);
        jobRepository.save(maintenance);

        long count = jobRepository.count();
        assertEquals(4, count);
    }

    // -------------------------------------------------------------------------
    // UPDATE JOB
    // -------------------------------------------------------------------------
    @Test
    void whenUpdateJob_thenChangesArePersisted() {
        Job saved = jobRepository.save(buildJob("Original Name", JobType.INSTALLATION));
        String jobId = saved.getJobIdentifier().getJobId();

        saved.setJobName("Updated Name");
        saved.setHourlyRate(100.00);
        saved.setActive(false);
        jobRepository.save(saved);

        Job found = jobRepository.findJobByJobIdentifier_JobId(jobId);
        assertNotNull(found);
        assertEquals("Updated Name", found.getJobName());
        assertEquals(100.00, found.getHourlyRate());
        assertFalse(found.isActive());
    }

    // -------------------------------------------------------------------------
    // ACTIVE STATUS
    // -------------------------------------------------------------------------
    @Test
    void whenDeactivateJob_thenIsActiveIsFalse() {
        Job saved = jobRepository.save(buildJob("Test Job", JobType.REPARATION));
        String jobId = saved.getJobIdentifier().getJobId();

        assertTrue(saved.isActive());

        saved.setActive(false);
        jobRepository.save(saved);

        Job found = jobRepository.findJobByJobIdentifier_JobId(jobId);
        assertNotNull(found);
        assertFalse(found.isActive());
    }
}
