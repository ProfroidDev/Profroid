package com.profroid.profroidapp.jobssubdomain.businessLayer;

import com.profroid.profroidapp.jobssubdomain.presentationLayer.JobRequestModel;
import com.profroid.profroidapp.jobssubdomain.presentationLayer.JobResponseModel;

import java.util.List;

public interface JobService {
    List<JobResponseModel> getAllJobs();
    JobResponseModel getJobById(String jobId);
    JobResponseModel createJob(JobRequestModel requestModel);
    JobResponseModel updateJob(String jobId, JobRequestModel requestModel);
    void deleteJob(String jobId);
}
