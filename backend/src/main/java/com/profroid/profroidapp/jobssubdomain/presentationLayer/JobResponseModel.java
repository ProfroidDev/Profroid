package com.profroid.profroidapp.jobssubdomain.presentationLayer;

import com.profroid.profroidapp.jobssubdomain.dataAccessLayer.JobType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class JobResponseModel {

    private String jobId;

    private String jobName;
    private String jobDescription;

    private Double hourlyRate;
    private Integer estimatedDurationMinutes;

    private JobType jobType;

    private boolean isActive;
}
