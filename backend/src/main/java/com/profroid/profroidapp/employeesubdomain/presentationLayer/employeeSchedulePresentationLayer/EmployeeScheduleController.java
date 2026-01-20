package com.profroid.profroidapp.employeesubdomain.presentationLayer.employeeSchedulePresentationLayer;

import com.profroid.profroidapp.employeesubdomain.businessLayer.employeeScheduleBusinessLayer.ScheduleService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1/employees/{employeeId}/schedules")
public class EmployeeScheduleController {

    public ScheduleService scheduleService;

    @Autowired
    public EmployeeScheduleController(ScheduleService scheduleService) {
        this.scheduleService = scheduleService;
    }

    @GetMapping()
    public ResponseEntity <List<EmployeeScheduleResponseModel>> getEmployeeSchedule(
            @PathVariable String employeeId,
            @RequestParam(required = false) String date) {
        List<EmployeeScheduleResponseModel> scheduleDtoList;
        if (date != null && !date.trim().isEmpty()) {
            scheduleDtoList = scheduleService.getEmployeeScheduleForDate(employeeId, date);
        } else {
            scheduleDtoList = scheduleService.getEmployeeSchedule(employeeId);
        }
        return ResponseEntity.ok().body(scheduleDtoList);
    }

    @PostMapping()
    public ResponseEntity<List<EmployeeScheduleResponseModel>> addEmployeeSchedule(
            @PathVariable String employeeId,
            @Valid @RequestBody List<EmployeeScheduleRequestModel> scheduleRequests) {
        List<EmployeeScheduleResponseModel> createdSchedule = scheduleService.addEmployeeSchedule(employeeId, scheduleRequests);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdSchedule);
    }

    @PutMapping()
    public ResponseEntity<List<EmployeeScheduleResponseModel>> updateEmployeeSchedule(
            @PathVariable String employeeId,
            @Valid @RequestBody List<EmployeeScheduleRequestModel> scheduleRequests) {
        List<EmployeeScheduleResponseModel> updatedSchedule = scheduleService.updateEmployeeSchedule(employeeId, scheduleRequests);
        return ResponseEntity.ok().body(updatedSchedule);
    }

    @PatchMapping("/{date}")
    public ResponseEntity<EmployeeScheduleResponseModel> patchDateSchedule(
            @PathVariable String employeeId,
            @PathVariable String date,
            @Valid @RequestBody EmployeeScheduleRequestModel scheduleRequest) {
        EmployeeScheduleResponseModel updatedDateSchedule = scheduleService.patchDateSchedule(employeeId, date, scheduleRequest);
        return ResponseEntity.ok().body(updatedDateSchedule);
    }

}
