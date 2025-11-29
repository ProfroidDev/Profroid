package com.profroid.profroidapp.employeesubdomain.businessLayer.employeeScheduleBusinessLayer;

import com.profroid.profroidapp.employeesubdomain.presentationLayer.employeeSchedulePresentationLayer.EmployeeScheduleResponseModel;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public interface ScheduleService {

    List<EmployeeScheduleResponseModel> getEmployeeSchedule(String employeeId);
}
