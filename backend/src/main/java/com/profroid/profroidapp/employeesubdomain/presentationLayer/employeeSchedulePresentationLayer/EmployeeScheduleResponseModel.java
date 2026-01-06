package com.profroid.profroidapp.employeesubdomain.presentationLayer.employeeSchedulePresentationLayer;


import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer.DayOfWeekType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class EmployeeScheduleResponseModel {

    private String employeeId;
    private DayOfWeekType dayOfWeek;
    private List<String> timeSlots;
}
