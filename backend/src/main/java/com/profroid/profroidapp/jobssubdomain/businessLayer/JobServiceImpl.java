package com.profroid.profroidapp.jobssubdomain.businessLayer;

import com.profroid.profroidapp.jobssubdomain.dataAccessLayer.Job;
import com.profroid.profroidapp.jobssubdomain.dataAccessLayer.JobRepository;
import com.profroid.profroidapp.jobssubdomain.mappingLayer.JobRequestMapper;
import com.profroid.profroidapp.jobssubdomain.mappingLayer.JobResponseMapper;
import com.profroid.profroidapp.jobssubdomain.presentationLayer.JobRequestModel;
import com.profroid.profroidapp.jobssubdomain.presentationLayer.JobResponseModel;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class JobServiceImpl implements JobService {

    private final JobRepository jobRepository;
    private final JobResponseMapper jobResponseMapper;
    private final JobRequestMapper jobRequestMapper;

    public JobServiceImpl(JobRepository jobRepository, JobResponseMapper jobResponseMapper, JobRequestMapper jobRequestMapper) {
        this.jobRepository = jobRepository;
        this.jobResponseMapper = jobResponseMapper;
        this.jobRequestMapper = jobRequestMapper;
    }

    @Override
    public List<JobResponseModel> getAllJobs() {
        List<Job> jobs = jobRepository.findAll();

        return jobResponseMapper.toResponseModelList(jobs);
    }

    @Override
    public JobResponseModel getJobById(String jobId) {
        Job foundJob = jobRepository.findJobByJobIdentifier_JobId(jobId);

        if (foundJob == null) {
            throw new EntityNotFoundException("Job not found:" + jobId);
        }
        return jobResponseMapper.toResponseModel(foundJob);
    }

    @Override
    public JobResponseModel createJob(JobRequestModel requestModel) {
        return null;
    }

    @Override
    public JobResponseModel updateJob(String jobId, JobRequestModel requestModel) {
        return null;
    }

    @Override
    public void deleteJob(String jobId) {

    }
}
