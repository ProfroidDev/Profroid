package com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer;

import jakarta.validation.constraints.NotNull;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScheduleRepository extends JpaRepository<Schedule, Integer> {


    List<Schedule> findAllByEmployee_EmployeeIdentifier_EmployeeId(String employeeId);

}
