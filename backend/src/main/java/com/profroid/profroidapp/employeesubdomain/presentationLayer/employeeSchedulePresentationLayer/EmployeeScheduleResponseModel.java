package com.profroid.profroidapp.employeesubdomain.presentationLayer.employeeSchedulePresentationLayer;


import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer.DayOfWeekType;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer.TimeSlotType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class EmployeeScheduleResponseModel {

    private String employeeId;
    private DayOfWeekType dayOfWeek;
    private List<String> timeSlots;
}
