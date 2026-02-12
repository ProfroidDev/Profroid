package com.profroid.profroidapp.jobssubdomain.mappingLayer;

import com.profroid.profroidapp.jobssubdomain.dataAccessLayer.Job;
import com.profroid.profroidapp.jobssubdomain.presentationLayer.JobResponseModel;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;

import java.util.List;

@Mapper(componentModel = "spring")
public interface JobResponseMapper {

    @Mappings({
            @Mapping(source = "job.jobIdentifier.jobId", target = "jobId"),
            @Mapping(source = "job.jobName", target = "jobName"),
            @Mapping(source = "job.jobDescription", target = "jobDescription"),
            @Mapping(source = "job.jobNameFr", target = "jobNameFr"),
            @Mapping(source = "job.jobDescriptionFr", target = "jobDescriptionFr"),
            @Mapping(source = "job.hourlyRate", target = "hourlyRate"),
            @Mapping(source = "job.estimatedDurationMinutes", target = "estimatedDurationMinutes"),
            @Mapping(source = "job.jobType", target = "jobType"),
            @Mapping(source = "job.active", target = "active"),
            @Mapping(source = "job.imageFileId", target = "imageFileId")
    })
    JobResponseModel toResponseModel(Job job);

    List<JobResponseModel> toResponseModelList(List<Job> jobs);
}
