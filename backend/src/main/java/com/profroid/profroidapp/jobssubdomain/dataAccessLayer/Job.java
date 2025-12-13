package com.profroid.profroidapp.jobssubdomain.dataAccessLayer;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
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

    @NotNull
    @Embedded
    private JobIdentifier jobIdentifier;

    @NotNull
    @Column(nullable = false)
    private String jobName;

    @NotNull
    @Column(nullable = false)
    private String jobDescription;

    @NotNull
    @Column(nullable = false)
    private Double hourlyRate;

    @NotNull
    @Column(nullable = false)
    private Integer estimatedDurationMinutes;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private JobType jobType;

    @Column(nullable = false)
    private boolean active;
}
