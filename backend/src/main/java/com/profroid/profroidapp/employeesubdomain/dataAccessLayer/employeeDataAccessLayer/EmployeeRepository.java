package com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Integer> {

    Employee findEmployeeByEmployeeIdentifier_EmployeeId(String employeeIdentifier);

    Employee findEmployeeByUserId(String userId);

    List<Employee> findAllByIsActiveTrue();

    // Find only TECHNICIAN employees who are active (for appointment booking)
    @Query("SELECT e FROM Employee e WHERE e.isActive = true AND e.employeeRole.employeeRoleType = 'TECHNICIAN'")
    List<Employee> findAllActiveTechnicians();
}
