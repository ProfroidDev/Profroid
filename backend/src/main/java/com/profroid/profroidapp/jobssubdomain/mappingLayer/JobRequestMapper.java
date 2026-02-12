package com.profroid.profroidapp.jobssubdomain.mappingLayer;

import com.profroid.profroidapp.jobssubdomain.dataAccessLayer.Job;
import com.profroid.profroidapp.jobssubdomain.dataAccessLayer.JobIdentifier;
import com.profroid.profroidapp.jobssubdomain.presentationLayer.JobRequestModel;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;

@Mapper(componentModel = "spring")
public interface JobRequestMapper {

    @Mappings({
            @Mapping(target = "id", ignore = true),
            @Mapping(source = "jobIdentifier", target = "jobIdentifier"),
            @Mapping(source = "requestModel.jobName", target = "jobName"),
            @Mapping(source = "requestModel.jobDescription", target = "jobDescription"),
            @Mapping(source = "requestModel.jobNameFr", target = "jobNameFr"),
            @Mapping(source = "requestModel.jobDescriptionFr", target = "jobDescriptionFr"),
            @Mapping(source = "requestModel.hourlyRate", target = "hourlyRate"),
            @Mapping(source = "requestModel.estimatedDurationMinutes", target = "estimatedDurationMinutes"),
            @Mapping(source = "requestModel.jobType", target = "jobType"),
            @Mapping(source = "requestModel.active", target = "active")
    })
    Job toEntity(JobRequestModel requestModel, JobIdentifier jobIdentifier);
}
