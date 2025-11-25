package com.profroid.profroidapp.jobssubdomain.dataAccessLayer;

import org.springframework.data.jpa.repository.JpaRepository;

public interface JobRepository extends JpaRepository<Job, Integer> {
    Job findJobByJobIdentifier_JobId(String jobId);
}
