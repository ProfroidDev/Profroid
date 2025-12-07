package com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer;

import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Embeddable
@Data
@NoArgsConstructor
public class AppointmentStatus {

    @NotNull
    @Enumerated(EnumType.STRING)
    private AppointmentStatusType appointmentStatusType;
}
