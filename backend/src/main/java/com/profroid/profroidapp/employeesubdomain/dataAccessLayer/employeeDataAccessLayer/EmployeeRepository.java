package com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Integer> {
}
