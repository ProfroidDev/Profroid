package com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer;

import com.profroid.profroidapp.customersubdomain.dataAccessLayer.Customer;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
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
    
    // Find appointments by address, date and status (for duplicate checking)
    @Query("SELECT a FROM Appointment a WHERE " +
           "a.appointmentAddress.streetAddress = :streetAddress AND " +
           "a.appointmentAddress.city = :city AND " +
           "a.appointmentAddress.province = :province AND " +
           "a.appointmentAddress.postalCode = :postalCode AND " +
           "DATE(a.appointmentDate) = :date AND " +
           "a.appointmentStatus.appointmentStatusType IN :statuses")
    List<Appointment> findByAddressAndDateAndStatusIn(
        @Param("streetAddress") String streetAddress,
        @Param("city") String city,
        @Param("province") String province,
        @Param("postalCode") String postalCode,
        @Param("date") LocalDate date,
        @Param("statuses") List<AppointmentStatusType> statuses
    );
    
    // Find appointments by technician, date and time slot (SCHEDULED or COMPLETED block the slot)
    @Query("SELECT a FROM Appointment a WHERE " +
           "a.technician = :technician AND " +
           "DATE(a.appointmentDate) = :date AND " +
           "a.appointmentStatus.appointmentStatusType IN " +
           "(com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.AppointmentStatusType.SCHEDULED, " +
           "com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.AppointmentStatusType.COMPLETED)")
    List<Appointment> findByTechnicianAndDateAndScheduled(
        @Param("technician") Employee technician,
        @Param("date") LocalDate date
    );
    
    // Find quotation appointments by customer and address
    @Query("SELECT a FROM Appointment a WHERE " +
           "a.customer = :customer AND " +
           "a.job.jobType = com.profroid.profroidapp.jobssubdomain.dataAccessLayer.JobType.QUOTATION AND " +
           "a.appointmentAddress.streetAddress = :streetAddress AND " +
           "a.appointmentAddress.city = :city AND " +
           "a.appointmentAddress.province = :province AND " +
           "a.appointmentAddress.postalCode = :postalCode")
    List<Appointment> findQuotationsByCustomerAndAddress(
        @Param("customer") Customer customer,
        @Param("streetAddress") String streetAddress,
        @Param("city") String city,
        @Param("province") String province,
        @Param("postalCode") String postalCode
    );
    
    // Find quotation appointments by address only (regardless of customer)
    // Used to enforce max 1 quotation per address per day rule
    @Query("SELECT a FROM Appointment a WHERE " +
           "a.job.jobType = com.profroid.profroidapp.jobssubdomain.dataAccessLayer.JobType.QUOTATION AND " +
           "a.appointmentAddress.streetAddress = :streetAddress AND " +
           "a.appointmentAddress.city = :city AND " +
           "a.appointmentAddress.province = :province AND " +
           "a.appointmentAddress.postalCode = :postalCode AND " +
           "DATE(a.appointmentDate) = :date")
    List<Appointment> findQuotationsByAddressAndDate(
        @Param("streetAddress") String streetAddress,
        @Param("city") String city,
        @Param("province") String province,
        @Param("postalCode") String postalCode,
        @Param("date") LocalDate date
    );
}

