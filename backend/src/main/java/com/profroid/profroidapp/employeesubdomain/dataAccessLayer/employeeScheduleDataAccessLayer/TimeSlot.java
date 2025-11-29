package com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer;

import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;

@Embeddable
@Data
@NoArgsConstructor
public class TimeSlot {

    @NotNull
    @Enumerated(EnumType.STRING)
    private TimeSlotType timeslot;
}
