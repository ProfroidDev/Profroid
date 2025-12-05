package com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer;


import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Embeddable
@Getter
@Setter
@AllArgsConstructor
public class AppointmentIdentifier {

    @Column(unique = true, nullable = false)
    private String appointmentId;

    public AppointmentIdentifier() {
        this.appointmentId = UUID.randomUUID().toString();
    }
}
