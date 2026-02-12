package com.profroid.profroidapp.jobssubdomain.presentationLayer;

import com.profroid.profroidapp.jobssubdomain.dataAccessLayer.JobType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobRequestModel {

    private String jobName;
    private String jobDescription;
    private String jobNameFr;
    private String jobDescriptionFr;

    private Double hourlyRate;
    private Integer estimatedDurationMinutes;

    private JobType jobType;

    private boolean active;
}
