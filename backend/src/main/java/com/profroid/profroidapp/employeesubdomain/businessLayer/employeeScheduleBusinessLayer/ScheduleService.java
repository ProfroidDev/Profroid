package com.profroid.profroidapp.employeesubdomain.businessLayer.employeeScheduleBusinessLayer;

import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer.DayOfWeekType;
import com.profroid.profroidapp.employeesubdomain.presentationLayer.employeeSchedulePresentationLayer.EmployeeScheduleRequestModel;
import com.profroid.profroidapp.employeesubdomain.presentationLayer.employeeSchedulePresentationLayer.EmployeeScheduleResponseModel;
import jakarta.validation.Valid;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public interface ScheduleService {

    List<EmployeeScheduleResponseModel> getEmployeeSchedule(String employeeId);

    List<EmployeeScheduleResponseModel> addEmployeeSchedule(String employeeId, List<EmployeeScheduleRequestModel> scheduleRequests);

    List<EmployeeScheduleResponseModel> updateEmployeeSchedule(String employeeId, @Valid List<EmployeeScheduleRequestModel> scheduleRequests);
    
    EmployeeScheduleResponseModel patchDateSchedule(String employeeId, String date, EmployeeScheduleRequestModel scheduleRequest);
}
