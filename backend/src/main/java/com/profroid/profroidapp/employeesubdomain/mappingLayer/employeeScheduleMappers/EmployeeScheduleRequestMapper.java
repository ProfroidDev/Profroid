package com.profroid.profroidapp.employeesubdomain.mappingLayer.employeeScheduleMappers;

import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer.*;
import com.profroid.profroidapp.employeesubdomain.presentationLayer.employeeSchedulePresentationLayer.EmployeeScheduleRequestModel;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;
import java.util.List;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface EmployeeScheduleRequestMapper {

    default DayOfWeek map(DayOfWeekType dayOfWeekType) {
        if (dayOfWeekType == null) {
            return null;
        }
        DayOfWeek dayOfWeek = new DayOfWeek();
        dayOfWeek.setDayOfWeek(dayOfWeekType);
        return dayOfWeek;
    }

    default TimeSlot map(TimeSlotType timeSlotType) {
        if (timeSlotType == null) {
            return null;
        }
        TimeSlot timeSlot = new TimeSlot();
        timeSlot.setTimeslot(timeSlotType);
        return timeSlot;
    }

    default List<Schedule> toEntityList(EmployeeScheduleRequestModel requestModel) {
        if (requestModel == null || requestModel.getTimeSlots() == null) {
            return List.of();
        }

        // Map the DayOfWeek once
        DayOfWeek dayOfWeekEntity = map(requestModel.getDayOfWeek());

        return requestModel.getTimeSlots().stream()
                .map(timeSlotType -> {
                    TimeSlot timeSlotEntity = map(timeSlotType);
                    Schedule schedule = new Schedule();
                    schedule.setDayOfWeek(dayOfWeekEntity);
                    schedule.setTimeSlot(timeSlotEntity);
                    return schedule;
                })
                .collect(Collectors.toList());
    }
}
