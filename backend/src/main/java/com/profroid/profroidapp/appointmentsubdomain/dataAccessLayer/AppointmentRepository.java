package com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer;

import com.profroid.profroidapp.customersubdomain.dataAccessLayer.Customer;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
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
    
    // Find appointments by technician and schedule
    List<Appointment> findAllByTechnicianAndSchedule(Employee technician, Schedule schedule);
    
    
    @Query("SELECT a FROM Appointment a WHERE a.technician = :technician " +
           "AND a.schedule IN :schedules " +
           "AND a.appointmentStatus.appointmentStatusType = com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.AppointmentStatusType.SCHEDULED")
    List<Appointment> findScheduledAppointmentsByTechnicianAndSchedules(
        @Param("technician") Employee technician, 
        @Param("schedules") List<Schedule> schedules
    );
}
