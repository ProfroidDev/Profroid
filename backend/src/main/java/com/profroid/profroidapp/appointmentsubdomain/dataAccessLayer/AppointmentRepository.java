package com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer;

import com.profroid.profroidapp.customersubdomain.dataAccessLayer.Customer;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Integer> {

    // Find appointment by appointmentId (UUID)
    Optional<Appointment> findAppointmentByAppointmentIdentifier_AppointmentId(String appointmentId);

    // Find all appointments for a specific customer
    List<Appointment> findAllByCustomer(Customer customer);

    // Find all appointments for a specific technician
    List<Appointment> findAllByTechnician(Employee technician);

    // Find all active appointments
    List<Appointment> findAllByIsActiveTrue();
}
