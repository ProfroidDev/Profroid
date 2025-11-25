package com.profroid.profroidapp.jobssubdomain.dataAccessLayer;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Embeddable
@Getter
@AllArgsConstructor
public class JobIdentifier {
    private String jobId;

    public JobIdentifier() {
        this.jobId = java.util.UUID.randomUUID().toString();
    }
}
