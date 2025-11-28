package com.profroid.profroidapp.jobssubdomain.dataAccessLayer;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "jobs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Embedded
    private JobIdentifier jobIdentifier;

    private String jobName;
    private String jobDescription;

    private Double hourlyRate;

    private Integer estimatedDurationMinutes;

    @Enumerated(EnumType.STRING)
    private JobType jobType;

    private boolean active;
}
