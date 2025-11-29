package com.profroid.profroidapp.employeesubdomain.presentationLayer.employeeSchedulePresentationLayer;

import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer.DayOfWeekType;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer.TimeSlotType;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class EmployeeScheduleRequestModel {

    @NotNull(message = "Day of the week is required for scheduling.")
    private DayOfWeekType dayOfWeek;

    @NotEmpty(message = "At least one time slot is required for scheduling.")
    private List<TimeSlotType> timeSlots;
}
