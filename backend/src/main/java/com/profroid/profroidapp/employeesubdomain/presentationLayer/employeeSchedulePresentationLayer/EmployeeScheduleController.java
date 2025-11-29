package com.profroid.profroidapp.employeesubdomain.presentationLayer.employeeSchedulePresentationLayer;

import com.profroid.profroidapp.employeesubdomain.businessLayer.employeeScheduleBusinessLayer.ScheduleService;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer.Schedule;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("api/v1/employees/{employeeId}/schedules")
public class EmployeeScheduleController {

    public ScheduleService scheduleService;

    @Autowired
    public EmployeeScheduleController(ScheduleService scheduleService) {
        this.scheduleService = scheduleService;
    }

    @GetMapping()
    public ResponseEntity <List<EmployeeScheduleResponseModel>> getEmployeeSchedule(@PathVariable String employeeId) {
        List<EmployeeScheduleResponseModel> scheduleDtoList = scheduleService.getEmployeeSchedule(employeeId);
        return ResponseEntity.ok().body(scheduleDtoList);


    }

}
