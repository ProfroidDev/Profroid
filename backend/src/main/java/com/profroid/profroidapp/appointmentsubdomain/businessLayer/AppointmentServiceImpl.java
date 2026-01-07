package com.profroid.profroidapp.appointmentsubdomain.businessLayer;

import com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.*;
import com.profroid.profroidapp.appointmentsubdomain.mappingLayer.AppointmentRequestMapper;
import com.profroid.profroidapp.appointmentsubdomain.mappingLayer.AppointmentResponseMapper;
import com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentRequestModel;
import com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentResponseModel;
import com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentStatusChangeRequestModel;
import com.profroid.profroidapp.appointmentsubdomain.presentationLayer.TechnicianBookedSlotsResponseModel;
import com.profroid.profroidapp.appointmentsubdomain.utils.AppointmentValidationUtils;
import com.profroid.profroidapp.cellarsubdomain.dataAccessLayer.Cellar;
import com.profroid.profroidapp.cellarsubdomain.dataAccessLayer.CellarRepository;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.Customer;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.CustomerRepository;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.EmployeeRepository;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.EmployeeRoleType;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer.Schedule;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer.ScheduleRepository;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer.TimeSlotType;
import com.profroid.profroidapp.employeesubdomain.mappingLayer.employeeMappers.EmployeeResponseMapper;
import com.profroid.profroidapp.jobssubdomain.dataAccessLayer.Job;
import com.profroid.profroidapp.jobssubdomain.dataAccessLayer.JobRepository;
import com.profroid.profroidapp.jobssubdomain.dataAccessLayer.JobType;
import com.profroid.profroidapp.utils.exceptions.InvalidOperationException;
import com.profroid.profroidapp.utils.exceptions.ResourceNotFoundException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
public class AppointmentServiceImpl implements AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final AppointmentRequestMapper appointmentRequestMapper;
    private final AppointmentResponseMapper appointmentResponseMapper;
    private final CustomerRepository customerRepository;
    private final EmployeeRepository employeeRepository;
    private final JobRepository jobRepository;
    private final CellarRepository cellarRepository;
    private final EmployeeResponseMapper employeeResponseMapper;
    private final ScheduleRepository scheduleRepository;
    private final AppointmentValidationUtils validationUtils;

    public AppointmentServiceImpl(AppointmentRepository appointmentRepository,
                                  AppointmentRequestMapper appointmentRequestMapper,
                                  AppointmentResponseMapper appointmentResponseMapper,
                                  CustomerRepository customerRepository,
                                  EmployeeRepository employeeRepository,
                                  JobRepository jobRepository,
                                  CellarRepository cellarRepository,
                                  EmployeeResponseMapper employeeResponseMapper,
                                  ScheduleRepository scheduleRepository,
                                  AppointmentValidationUtils validationUtils) {
        this.appointmentRepository = appointmentRepository;
        this.appointmentRequestMapper = appointmentRequestMapper;
        this.appointmentResponseMapper = appointmentResponseMapper;
        this.customerRepository = customerRepository;
        this.employeeRepository = employeeRepository;
        this.jobRepository = jobRepository;
        this.cellarRepository = cellarRepository;
        this.employeeResponseMapper = employeeResponseMapper;
        this.scheduleRepository = scheduleRepository;
        this.validationUtils = validationUtils;
    }

    @Override
    public AppointmentResponseModel addAppointment(AppointmentRequestModel requestModel, String userId, String userRole) {
        // Use Canada/Eastern timezone for accurate time comparisons
        LocalDateTime now = LocalDateTime.now(ZoneId.of("America/Toronto"));
        LocalDateTime appointmentDateTime = requestModel.getAppointmentDate();
        // Normalize time from optional startTime field if provided
        try {
            String start = requestModel.getAppointmentStartTime();
            if (start != null && !start.isBlank()) {
                String[] parts = start.split(":");
                int hh = Integer.parseInt(parts[0]);
                int mm = parts.length > 1 ? Integer.parseInt(parts[1]) : 0;
                appointmentDateTime = appointmentDateTime.toLocalDate().atTime(hh, mm);
            }
        } catch (Exception ignore) { }

        // Received appointment date-time now normalized from optional start time

        if (appointmentDateTime.isBefore(now)) {
            throw new InvalidOperationException(
                "Cannot book an appointment in the past. Appointment time: " + appointmentDateTime + 
                ", Current time: " + now
            );
        }

        if (appointmentDateTime.getDayOfWeek() == java.time.DayOfWeek.SATURDAY || 
            appointmentDateTime.getDayOfWeek() == java.time.DayOfWeek.SUNDAY) {
            throw new InvalidOperationException(
                "Appointments cannot be scheduled on weekends (Saturday or Sunday). " +
                "Please choose a weekday. Requested date: " + appointmentDateTime.toLocalDate() + 
                " (" + appointmentDateTime.getDayOfWeek() + ")"
            );
        }

        validationUtils.validateBookingDeadline(appointmentDateTime, now);

        Customer customer;
        Employee technician;
        
        // Determine customer based on user role
        if ("CUSTOMER".equals(userRole)) {
            // Customer booking for themselves
            customer = customerRepository.findCustomerByCustomerIdentifier_CustomerId(userId);
            if (customer == null) {
                throw new ResourceNotFoundException("Customer " + userId + " not found.");
            }
        } else {
            // Technician or other role booking for a customer
            // Customer must be specified in request by customerId
            if (requestModel.getCustomerId() == null || requestModel.getCustomerId().isEmpty()) {
                throw new InvalidOperationException(
                    "When technician creates an appointment, customer ID must be provided in the request body."
                );
            }
            
            customer = customerRepository.findCustomerByCustomerIdentifier_CustomerId(
                requestModel.getCustomerId()
            );
            
            if (customer == null) {
                throw new ResourceNotFoundException(
                    "Customer not found with ID: " + requestModel.getCustomerId()
                );
            }
        }
        
        // Find technician by ID (preferred) or name (fallback for backward compatibility)
        if (requestModel.getTechnicianId() == null || requestModel.getTechnicianId().isBlank()) {
            // No technician ID provided - check for name-based lookup or auto-assign
            if (requestModel.getTechnicianFirstName() == null || requestModel.getTechnicianFirstName().isBlank() ||
                requestModel.getTechnicianLastName() == null || requestModel.getTechnicianLastName().isBlank()) {
                
                // Technician not specified - auto-assign for customer bookings
                if ("CUSTOMER".equals(userRole)) {
                    technician = autoAssignTechnician(requestModel.getAppointmentDate(), requestModel.getJobName());
                } else {
                    throw new InvalidOperationException(
                        "Technician must be specified when booking from non-customer role."
                    );
                }
            } else {
                // Technician name specified - find by name (fallback)
                List<Employee> technicianCandidates = employeeRepository.findByFirstNameAndLastName(
                    requestModel.getTechnicianFirstName(), 
                    requestModel.getTechnicianLastName()
                );
                
                if (technicianCandidates.isEmpty()) {
                    throw new ResourceNotFoundException(
                        "Technician not found: " + requestModel.getTechnicianFirstName() + 
                        " " + requestModel.getTechnicianLastName()
                    );
                }
                
                // Filter for active technicians with TECHNICIAN role
                technician = technicianCandidates.stream()
                    .filter(Employee::getIsActive)
                    .filter(e -> e.getEmployeeRole().getEmployeeRoleType() == EmployeeRoleType.TECHNICIAN)
                    .findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException(
                        "No active technician found with the name: " + requestModel.getTechnicianFirstName() + 
                        " " + requestModel.getTechnicianLastName()
                    ));
            }
        } else {
            // Technician ID provided - lookup by ID (preferred method, avoids same-name conflicts)
            technician = employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(requestModel.getTechnicianId());
            
            if (technician == null) {
                throw new ResourceNotFoundException(
                    "Technician not found with ID: " + requestModel.getTechnicianId()
                );
            }
            
            if (!technician.getIsActive()) {
                throw new InvalidOperationException(
                    "Selected technician is no longer active."
                );
            }
            
            if (technician.getEmployeeRole().getEmployeeRoleType() != EmployeeRoleType.TECHNICIAN) {
                throw new InvalidOperationException(
                    "Selected employee is not a technician."
                );
            }
        }
        
        // Find job by name
        Job job = jobRepository.findJobByJobName(requestModel.getJobName());
        if (job == null) {
            throw new ResourceNotFoundException("Job not found: " + requestModel.getJobName());
        }
        
        if (!job.isActive()) {
            throw new InvalidOperationException("Job " + requestModel.getJobName() + " is not active.");
        }
        
        // Find cellar by name and owner (prevents duplicate name issues)
        Cellar cellar = cellarRepository.findCellarByNameAndOwnerCustomerIdentifier_CustomerId(
            requestModel.getCellarName(), 
            customer.getCustomerIdentifier().getCustomerId()
        );
        if (cellar == null) {
            throw new ResourceNotFoundException("Cellar not found: " + requestModel.getCellarName() + " for this customer");
        }
        validationUtils.validateCellarOwnership(cellar, customer);
        validationUtils.validateProvinceRestriction(requestModel.getAppointmentAddress());
        validationUtils.validateTechnicianSchedule(technician, appointmentDateTime);
        validationUtils.validateServiceTypeRestrictions(job.getJobType(), userRole);
        validationUtils.validateQuotationCompleted(job.getJobType(), requestModel, customer, appointmentDateTime);
        validationUtils.validateDuplicateQuotation(job.getJobType(), requestModel, appointmentDateTime.toLocalDate(), appointmentDateTime, customer);
        validationUtils.validateDuplicateServiceAddressAndDay(job.getJobType(), requestModel, appointmentDateTime.toLocalDate());
        validationUtils.validateTimeSlotAvailability(technician, appointmentDateTime, job);
        
        // Check if customer already has appointments at this time (for both CUSTOMER and TECHNICIAN roles)
        // This prevents double-booking the customer regardless of who creates the appointment
        LocalDateTime startOfDay = appointmentDateTime.toLocalDate().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);

        List<Appointment> customerAppointmentsAtTime =
                appointmentRepository.findAllByCustomerAndAppointmentDateBetweenAndStatusIn(
                        customer,
                        startOfDay,
                        endOfDay,
                        Arrays.asList(AppointmentStatusType.SCHEDULED, AppointmentStatusType.COMPLETED)
                );
        if (!customerAppointmentsAtTime.isEmpty()) {
            for (Appointment existing : customerAppointmentsAtTime) {
                LocalTime existingStart = existing.getAppointmentDate().toLocalTime();
                LocalTime existingEnd = existingStart.plusMinutes(
                    existing.getJob() != null ? existing.getJob().getEstimatedDurationMinutes() : 60
                );
                LocalTime newEnd = appointmentDateTime.toLocalTime().plusMinutes(job.getEstimatedDurationMinutes());
                
                // Check for overlap
                if (appointmentDateTime.toLocalTime().isBefore(existingEnd) && existingStart.isBefore(newEnd)) {
                    throw new InvalidOperationException(
                        "This customer already has an appointment at this time. Please choose a different time slot."
                    );
                }
            }
        }
        
        // Validate that appointment doesn't exceed 5 PM (17:00)
        LocalTime appointmentStart = appointmentDateTime.toLocalTime();
        int durationMinutes = job.getEstimatedDurationMinutes();
        LocalTime appointmentEnd = appointmentStart.plusMinutes(durationMinutes);
        if (appointmentEnd.isAfter(LocalTime.of(17, 0))) {
            throw new InvalidOperationException("ERROR_APPOINTMENT_ENDS_AFTER_CLOSING");
        }

        Appointment appointment = appointmentRequestMapper.toEntity(requestModel);
        appointment.setCustomer(customer);
        appointment.setTechnician(technician);
        appointment.setJob(job);
        appointment.setCellar(cellar);
        appointment.setSchedule(null); // Schedule can be set later if needed
        appointment.setCreatedByRole(userRole); // Track who created this appointment
        
        // Save appointment
        Appointment savedAppointment = appointmentRepository.save(appointment);
        
        return appointmentResponseMapper.toResponseModel(savedAppointment);
    }

    @Override
    public List<AppointmentResponseModel> getCustomerAppointments(String customerId) {
       
        Customer customer = customerRepository.findCustomerByCustomerIdentifier_CustomerId(customerId);
        
        if (customer == null) {
            throw new ResourceNotFoundException("Customer " + customerId + " not found.");
        }


        List<Appointment> appointments = appointmentRepository.findAllByCustomer(customer);

        return appointmentResponseMapper.toResponseModelList(
            validateAppointmentEntities(appointments)
        );
    }

    @Override
    public List<AppointmentResponseModel> getTechnicianAppointments(String technicianId) {
        // Find technician by their employee identifier (UUID)
        Employee technician = employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(technicianId);
        
        if (technician == null) {
            throw new ResourceNotFoundException("Technician " + technicianId + " not found.");
        }
        
        // Prevent deactivated technicians from accessing appointments
        if (!technician.getIsActive()) {
            throw new ResourceNotFoundException("Technician " + technicianId + " is deactivated and cannot access appointments.");
        }

        // Get all appointments for this technician
        List<Appointment> appointments = appointmentRepository.findAllByTechnician(technician);
        
        // Validate all appointments have valid related entities (in case some were deleted)
        return appointmentResponseMapper.toResponseModelList(
            validateAppointmentEntities(appointments)
        );
    }

    @Override
    public AppointmentResponseModel getAppointmentById(String appointmentId, String userId, String userRole) {
        // Find appointment by ID
        Optional<Appointment> appointmentOptional = appointmentRepository.findAppointmentByAppointmentIdentifier_AppointmentId(appointmentId);
        
        if (appointmentOptional.isEmpty()) {
            throw new ResourceNotFoundException("Appointment " + appointmentId + " not found.");
        }

        Appointment appointment = appointmentOptional.get();

        validateAppointmentEntityIntegrity(appointment);

        if ("CUSTOMER".equals(userRole)) {
            Customer customer = customerRepository.findCustomerByCustomerIdentifier_CustomerId(userId);
            if (customer == null || !customer.getId().equals(appointment.getCustomer().getId())) {
                throw new ResourceNotFoundException("You don't have permission to view this appointment.");
            }
        } else if ("TECHNICIAN".equals(userRole)) {
            Employee technician = employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(userId);
            
            if (technician == null) {
                throw new ResourceNotFoundException("Technician not found.");
            }
            
            // Prevent deactivated technicians from accessing appointments
            if (!technician.getIsActive()) {
                throw new ResourceNotFoundException("You are deactivated and cannot access appointments.");
            }
            
            if (!technician.getId().equals(appointment.getTechnician().getId())) {
                throw new ResourceNotFoundException("You don't have permission to view this appointment.");
            }
        }

        return appointmentResponseMapper.toResponseModel(appointment);
    }


    private void validateAppointmentEntityIntegrity(Appointment appointment) {
        if (appointment.getCustomer() == null) {
            throw new ResourceNotFoundException(
                "Appointment " + appointment.getAppointmentIdentifier().getAppointmentId() + 
                " has invalid customer (customer may have been deleted)."
            );
        }
        
        if (appointment.getTechnician() == null) {
            throw new ResourceNotFoundException(
                "Appointment " + appointment.getAppointmentIdentifier().getAppointmentId() + 
                " has invalid technician (technician may have been deleted)."
            );
        }
        
        if (appointment.getJob() == null) {
            throw new ResourceNotFoundException(
                "Appointment " + appointment.getAppointmentIdentifier().getAppointmentId() + 
                " has invalid job (job may have been deleted)."
            );
        }
        
        if (appointment.getCellar() == null) {
            throw new ResourceNotFoundException(
                "Appointment " + appointment.getAppointmentIdentifier().getAppointmentId() + 
                " has invalid cellar (cellar may have been deleted)."
            );
        }
    }
    
 
    private List<Appointment> validateAppointmentEntities(List<Appointment> appointments) {
        return appointments.stream()
            .filter(appointment -> {
                try {
                    validateAppointmentEntityIntegrity(appointment);
                    return true;
                } catch (ResourceNotFoundException e) {
                    return false;
                }
            })
            .toList();
    }

        @Override
        public AppointmentResponseModel updateAppointment(String appointmentId, AppointmentRequestModel appointmentRequest, String userId, String effectiveRole) {
            Optional<Appointment> appointmentOptional = appointmentRepository.findAppointmentByAppointmentIdentifier_AppointmentId(appointmentId);
            if (appointmentOptional.isEmpty()) {
                throw new ResourceNotFoundException("Appointment " + appointmentId + " not found.");
            }
            Appointment appointment = appointmentOptional.get();
            validateAppointmentEntityIntegrity(appointment);

            // Block update if appointment is completed or cancelled
            if (appointment.getAppointmentStatus() != null) {
                AppointmentStatusType status = appointment.getAppointmentStatus().getAppointmentStatusType();
                if (status == AppointmentStatusType.COMPLETED || status == AppointmentStatusType.CANCELLED) {
                    throw new InvalidOperationException("Cannot update a completed or cancelled appointment.");
                }
            }

            // Permission check: customers can only edit appointments they created, technicians can edit their own and customer-created quotations
            if ("CUSTOMER".equals(effectiveRole)) {
                // Customer can only edit appointments they created
                if (!"CUSTOMER".equals(appointment.getCreatedByRole())) {
                    throw new InvalidOperationException("You can only edit appointments you have created.");
                }
                Customer customer = customerRepository.findCustomerByCustomerIdentifier_CustomerId(userId);
                if (customer == null || !customer.getId().equals(appointment.getCustomer().getId())) {
                    throw new ResourceNotFoundException("You don't have permission to update this appointment.");
                }
            } else if ("TECHNICIAN".equals(effectiveRole)) {
                // Technician can edit their own appointments or customer-created quotations
                boolean isTechnicianOwned = "TECHNICIAN".equals(appointment.getCreatedByRole());
                boolean isCustomerQuotation = "CUSTOMER".equals(appointment.getCreatedByRole()) && appointment.getJob() != null && JobType.QUOTATION.equals(appointment.getJob().getJobType());

                if (!isTechnicianOwned && !isCustomerQuotation) {
                    throw new InvalidOperationException("You can only edit appointments you have created.");
                }

                Employee technician = employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(userId);
                if (technician == null) {
                    throw new ResourceNotFoundException("Technician not found.");
                }

                // For technician-owned appointments, verify technician assignment
                if (isTechnicianOwned && !technician.getId().equals(appointment.getTechnician().getId())) {
                    throw new ResourceNotFoundException("You don't have permission to update this appointment.");
                }

                if (isCustomerQuotation) {
                    if (!technician.getId().equals(appointment.getTechnician().getId())) {
                        throw new ResourceNotFoundException("You don't have permission to update this appointment.");
                    }
                    if (!appointmentRequest.getJobName().equals(appointment.getJob().getJobName())) {
                        throw new InvalidOperationException("You cannot change the service type of a customer-created quotation.");
                    }

                    // Check if customer is being changed
                    if (appointmentRequest.getCustomerId() != null &&
                        appointment.getCustomer().getCustomerIdentifier() != null &&
                        !Objects.equals(appointmentRequest.getCustomerId(),
                                       appointment.getCustomer().getCustomerIdentifier().getCustomerId())) {
                        throw new InvalidOperationException("You cannot change the customer for a customer-created quotation.");
                    }
                }
            }

            // Find job by name
            Job job = jobRepository.findJobByJobName(appointmentRequest.getJobName());
            if (job == null) {
                throw new ResourceNotFoundException("Job not found: " + appointmentRequest.getJobName());
            }
            if (!job.isActive()) {
                throw new InvalidOperationException("Job " + appointmentRequest.getJobName() + " is not active.");
            }

            // For technician edits, get the new customer from the request (if customer can be changed)
            // For customer edits, use the existing customer
            Customer customerForValidation = appointment.getCustomer();
            if ("TECHNICIAN".equals(effectiveRole) && appointmentRequest.getCustomerId() != null) {
                // Technician is changing the customer
                Customer newCustomer = customerRepository.findCustomerByCustomerIdentifier_CustomerId(appointmentRequest.getCustomerId());
                if (newCustomer == null) {
                    throw new ResourceNotFoundException("Customer not found with ID: " + appointmentRequest.getCustomerId());
                }
                customerForValidation = newCustomer;
            }

            // Find cellar by name and owner (prevents duplicate name issues)
            Cellar cellar = cellarRepository.findCellarByNameAndOwnerCustomerIdentifier_CustomerId(
                appointmentRequest.getCellarName(),
                customerForValidation.getCustomerIdentifier().getCustomerId()
            );
            if (cellar == null) {
                throw new ResourceNotFoundException("Cellar not found: " + appointmentRequest.getCellarName() + " for this customer");
            }

            // Validate rules (same as POST)
            LocalDateTime now = LocalDateTime.now(ZoneId.of("America/Toronto"));
            LocalDateTime appointmentDateTime = appointmentRequest.getAppointmentDate();
            if (appointmentDateTime.isBefore(now)) {
                throw new InvalidOperationException("Cannot book an appointment in the past. Appointment time: " + appointmentDateTime + ", Current time: " + now);
            }
            if (appointmentDateTime.getDayOfWeek() == java.time.DayOfWeek.SATURDAY || appointmentDateTime.getDayOfWeek() == java.time.DayOfWeek.SUNDAY) {
                throw new InvalidOperationException("Appointments cannot be scheduled on weekends (Saturday or Sunday). Please choose a weekday. Requested date: " + appointmentDateTime.toLocalDate() + " (" + appointmentDateTime.getDayOfWeek() + ")");
            }
            validationUtils.validateBookingDeadline(appointmentDateTime, now);
            validationUtils.validateCellarOwnership(cellar, customerForValidation);

            // For customer edits, allow technician reassignment
            // For technician edits, validate against the same technician
            Employee assignedTechnician = appointment.getTechnician();
            if ("CUSTOMER".equals(effectiveRole)) {
                // Customer editing: validate that at least one technician is available
                // and reassign if necessary
                try {
                    // Check if current technician is still available
                    validationUtils.validateTechnicianSchedule(assignedTechnician, appointmentDateTime);
                    validationUtils.validateTimeSlotAvailability(assignedTechnician, appointmentDateTime, job, appointment.getAppointmentIdentifier().getAppointmentId());
                    // Current technician is available, keep them assigned
                } catch (InvalidOperationException | ResourceNotFoundException e) {
                    // Current technician is not available, find a new one
                    assignedTechnician = findAvailableTechnicianForUpdate(appointmentDateTime, job, appointment.getAppointmentIdentifier().getAppointmentId());
                }
            } else {
                // Technician editing: must validate with their own schedule
                validationUtils.validateTechnicianSchedule(assignedTechnician, appointmentDateTime);
                validationUtils.validateTimeSlotAvailability(assignedTechnician, appointmentDateTime, job, appointment.getAppointmentIdentifier().getAppointmentId());
            }

            validationUtils.validateServiceTypeRestrictions(job.getJobType(), effectiveRole);
            validationUtils.validateProvinceRestriction(appointmentRequest.getAppointmentAddress());
            validationUtils.validateQuotationCompleted(job.getJobType(), appointmentRequest, customerForValidation, appointmentDateTime);
            validationUtils.validateDuplicateQuotation(job.getJobType(), appointmentRequest, appointmentDateTime.toLocalDate(), appointmentDateTime, customerForValidation, appointment.getAppointmentIdentifier().getAppointmentId());

            // Check if customer already has appointments at this time (exclude the current appointment being updated)
            LocalDateTime startOfDay = appointmentDateTime.toLocalDate().atStartOfDay();
            LocalDateTime endOfDay = startOfDay.plusDays(1);

            List<Appointment> customerAppointmentsAtTime =
                    appointmentRepository.findAllByCustomerAndAppointmentDateBetweenAndStatusIn(
                            customerForValidation,
                            startOfDay,
                            endOfDay,
                            Arrays.asList(AppointmentStatusType.SCHEDULED, AppointmentStatusType.COMPLETED)
                    );
            if (!customerAppointmentsAtTime.isEmpty()) {
                for (Appointment existing : customerAppointmentsAtTime) {
                    // Skip the current appointment being updated
                    if (existing.getAppointmentIdentifier().getAppointmentId().equals(appointment.getAppointmentIdentifier().getAppointmentId())) {
                        continue;
                    }

                    LocalTime existingStart = existing.getAppointmentDate().toLocalTime();
                    LocalTime existingEnd = existingStart.plusMinutes(
                        existing.getJob() != null ? existing.getJob().getEstimatedDurationMinutes() : 60
                    );
                    LocalTime newEnd = appointmentDateTime.toLocalTime().plusMinutes(job.getEstimatedDurationMinutes());

                    // Check for overlap
                    if (appointmentDateTime.toLocalTime().isBefore(existingEnd) && existingStart.isBefore(newEnd)) {
                        throw new InvalidOperationException(
                            "This customer already has an appointment at this time. Please choose a different time slot."
                        );
                    }
                }
            }
            // Prevent duplicate service for same address/day/technician except for the current appointment
            validationUtils.validateDuplicateServiceAddressAndDayExcludeCurrent(job.getJobType(), appointmentRequest, appointmentDateTime.toLocalDate(), appointmentDateTime, appointment.getCustomer(), appointment.getAppointmentIdentifier().getAppointmentId());

            // Additional explicit check that appointment doesn't exceed 5 PM (17:00)
            LocalTime appointmentStart = appointmentDateTime.toLocalTime();
            Integer durationMinutesObj = job.getEstimatedDurationMinutes();
            int durationMinutes = (durationMinutesObj != null) ? durationMinutesObj : getDefaultDuration(job.getJobType());
            LocalTime appointmentEnd = appointmentStart.plusMinutes(durationMinutes);
            if (appointmentEnd.isAfter(LocalTime.of(17, 0))) {
                throw new InvalidOperationException("ERROR_APPOINTMENT_ENDS_AFTER_CLOSING");
            }

            // Update appointment fields
            appointment.setJob(job);
            appointment.setCellar(cellar);
            appointment.setAppointmentDate(appointmentDateTime);
            appointment.setDescription(appointmentRequest.getDescription());
            appointment.setAppointmentAddress(appointmentRequest.getAppointmentAddress());

            // Update customer only if a technician user explicitly changed it
            if ("TECHNICIAN".equals(effectiveRole) && appointmentRequest.getCustomerId() != null) {
                appointment.setCustomer(customerForValidation);
            }

            // Update technician assignment if it was changed (for customer edits with conflicts)
            // For technician edits, the technician remains the same (already validated)
            if (!assignedTechnician.getId().equals(appointment.getTechnician().getId())) {
                appointment.setTechnician(assignedTechnician);
            }

            // Do not change status for customer or technician edits
            Appointment updatedAppointment = appointmentRepository.save(appointment);
            return appointmentResponseMapper.toResponseModel(updatedAppointment);
        }

    
        @Override
        public AppointmentResponseModel patchAppointmentStatus(String appointmentId, AppointmentStatusChangeRequestModel statusRequest, String userId, String effectiveRole) {
            Optional<Appointment> appointmentOptional = appointmentRepository.findAppointmentByAppointmentIdentifier_AppointmentId(appointmentId);
            if (appointmentOptional.isEmpty()) {
                throw new ResourceNotFoundException("Appointment " + appointmentId + " not found.");
            }
            Appointment appointment = appointmentOptional.get();
            validateAppointmentEntityIntegrity(appointment);

            AppointmentStatusType newStatusType = AppointmentStatusType.valueOf(statusRequest.getStatus());
            AppointmentStatusType currentStatusType = appointment.getAppointmentStatus().getAppointmentStatusType();

            if ("CUSTOMER".equals(effectiveRole)) {
                Customer customer = customerRepository.findCustomerByCustomerIdentifier_CustomerId(userId);
                if (customer == null || !customer.getId().equals(appointment.getCustomer().getId())) {
                    throw new ResourceNotFoundException("You don't have permission to update this appointment status.");
                }
                // Customer can only switch to CANCELLED, and cannot change status once cancelled
                if (currentStatusType == AppointmentStatusType.CANCELLED) {
                    throw new InvalidOperationException("Cannot change status of a cancelled appointment.");
                }
                if (newStatusType != AppointmentStatusType.CANCELLED) {
                    throw new InvalidOperationException("Customer can only cancel their own appointment.");
                }
            } else if ("TECHNICIAN".equals(effectiveRole)) {
                Employee technician = employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(userId);
                if (technician == null || !technician.getId().equals(appointment.getTechnician().getId())) {
                    throw new ResourceNotFoundException("You don't have permission to update this appointment status.");
                }
                // Technicians cannot change status of a cancelled appointment
                if (currentStatusType == AppointmentStatusType.CANCELLED) {
                    throw new InvalidOperationException("Cannot change status of a cancelled appointment.");
                }
            } else {
                throw new InvalidOperationException("Only customers or technicians can change appointment status.");
            }

            AppointmentStatus newStatus = new AppointmentStatus();
            newStatus.setAppointmentStatusType(newStatusType);
            appointment.setAppointmentStatus(newStatus);

            // If status is CANCELLED, free up the slot (remove schedule association)
            if (newStatusType == AppointmentStatusType.CANCELLED) {
                appointment.setSchedule(null);
            }

            Appointment updatedAppointment = appointmentRepository.save(appointment);
            return appointmentResponseMapper.toResponseModel(updatedAppointment);
        }
        
        @Override
        public TechnicianBookedSlotsResponseModel getTechnicianBookedSlots(String technicianId, LocalDate date, String appointmentId) {
            // Validate technician exists
            Employee technician = employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(technicianId);
            if (technician == null) {
                throw new ResourceNotFoundException("Technician not found: " + technicianId);
            }
            
            // Find all appointments for this technician on the given date
            LocalDateTime startOfDay = date.atStartOfDay();
            LocalDateTime endOfDay = date.plusDays(1).atStartOfDay();
            
            List<Appointment> appointments = appointmentRepository.findByTechnicianAndAppointmentDateBetween(
                    technician, startOfDay, endOfDay);
            
            // Filter out cancelled appointments and the appointment being edited, then build booked slots
            List<TechnicianBookedSlotsResponseModel.BookedSlot> bookedSlots = appointments.stream()
                    .filter(apt -> apt.getAppointmentStatus() != null &&
                            (apt.getAppointmentStatus().getAppointmentStatusType() == AppointmentStatusType.SCHEDULED ||
                                    apt.getAppointmentStatus().getAppointmentStatusType() == AppointmentStatusType.COMPLETED))
                    .filter(apt -> appointmentId == null || appointmentId.isBlank() || 
                            !appointmentId.equals(apt.getAppointmentIdentifier().getAppointmentId()))
                    .map(apt -> {
                        // Extract start time from appointmentDate
                        LocalTime startTime = apt.getAppointmentDate().toLocalTime();
                        
                        // Calculate end time based on job duration (default 60 mins if job is null)
                        int durationMinutes = apt.getJob() != null ? apt.getJob().getEstimatedDurationMinutes() : 60;
                        LocalTime endTime = startTime.plusMinutes(durationMinutes);
                        
                        return TechnicianBookedSlotsResponseModel.BookedSlot.builder()
                                .startTime(startTime)
                                .endTime(endTime)
                                .build();
                    })
                    .toList();
            
            return TechnicianBookedSlotsResponseModel.builder()
                    .technicianId(technicianId)
                    .date(date)
                    .bookedSlots(bookedSlots)
                    .build();
        }
        
        @Override
        public TechnicianBookedSlotsResponseModel getAggregatedAvailability(LocalDate date, String jobName, String userId, String userRole, String appointmentId) {
            // Get the job to determine duration
            Job job = jobRepository.findJobByJobName(jobName);
            int jobDurationMinutes = (job != null && job.getEstimatedDurationMinutes() > 0) 
                    ? job.getEstimatedDurationMinutes() 
                    : 120; // Default 2 hours
            
            // Get all active technicians
            List<Employee> technicians = employeeRepository.findAll().stream()
                    .filter(Employee::getIsActive)
                    .filter(e -> e.getEmployeeRole().getEmployeeRoleType() == EmployeeRoleType.TECHNICIAN)
                    .toList();
            
            if (technicians.isEmpty()) {
                return TechnicianBookedSlotsResponseModel.builder()
                        .technicianId("all") // Aggregated across all technicians
                        .date(date)
                        .bookedSlots(new ArrayList<>())
                        .build();
            }
            
            // For customers, get their existing appointments to filter out busy times
            Customer customer = null;
            List<Appointment> customerAppointments = new ArrayList<>();
            if ("customer".equalsIgnoreCase(userRole) || "CUSTOMER".equalsIgnoreCase(userRole)) {
                // userId from auth might be the auth service user ID, try to find customer by userId first
                customer = customerRepository.findCustomerByUserId(userId);
                // If not found, try by customerId
                if (customer == null) {
                    customer = customerRepository.findCustomerByCustomerIdentifier_CustomerId(userId);
                }
                if (customer != null) {
                    LocalDateTime startOfDay = date.atStartOfDay();
                    LocalDateTime endOfDay = startOfDay.plusDays(1);

                        customerAppointments =
                            appointmentRepository.findAllByCustomerAndAppointmentDateBetweenAndStatusIn(
                                customer,
                                startOfDay,
                                endOfDay,
                                Arrays.asList(AppointmentStatusType.SCHEDULED, AppointmentStatusType.COMPLETED)
                            );

                        // When editing, allow the current appointment's slot to remain available
                        if (appointmentId != null && !appointmentId.isBlank()) {
                        customerAppointments = customerAppointments.stream()
                            .filter(apt -> !appointmentId.equals(apt.getAppointmentIdentifier().getAppointmentId()))
                            .toList();
                        }
                }
            }
            
            // Define available time slots for the day (9 AM, 11 AM, 1 PM, 3 PM, 5 PM)
            LocalTime[] timeSlots = {
                    LocalTime.of(9, 0),
                    LocalTime.of(11, 0),
                    LocalTime.of(13, 0),
                    LocalTime.of(15, 0),
                    LocalTime.of(17, 0)
            };
            
            List<TechnicianBookedSlotsResponseModel.BookedSlot> bookedSlots = new ArrayList<>();
            LocalDateTime dayStart = date.atStartOfDay();
            LocalDateTime dayEnd = date.plusDays(1).atStartOfDay();
            
            // For each time slot, check if ANY technician is available
            for (LocalTime slotTime : timeSlots) {
                LocalTime slotEnd = slotTime.plusMinutes(jobDurationMinutes);
                
                // Skip slots that would end after 6 PM
                if (slotEnd.isAfter(LocalTime.of(18, 0))) {
                    continue;
                }
                
                boolean hasAvailableTechnician = false;
                
                // Check if at least one technician is available for this slot
                for (Employee technician : technicians) {
                    // Get the technician's schedules using their employee ID
                    String techId = technician.getEmployeeIdentifier().getEmployeeId();
                    List<Schedule> schedules = scheduleRepository.findAllByEmployee_EmployeeIdentifier_EmployeeId(techId);
                    
                    // Determine what schedule to check (date-specific or weekly)
                    List<Schedule> relevantSchedules = new ArrayList<>();
                    
                    // Check for date-specific schedule first
                    List<Schedule> dateSpecific = scheduleRepository.findAllByEmployee_EmployeeIdentifier_EmployeeIdAndSpecificDate(techId, date);
                    
                    if (!dateSpecific.isEmpty()) {
                        relevantSchedules = dateSpecific;
                    } else {
                        // Fall back to weekly schedule - get the day name from LocalDate
                        java.time.DayOfWeek dayOfWeek = date.getDayOfWeek();
                        String dayName = dayOfWeek.toString(); // Returns like "MONDAY", "TUESDAY", etc.
                        
                        relevantSchedules = schedules.stream()
                                .filter(s -> s.getSpecificDate() == null && s.getDayOfWeek() != null && 
                                        s.getDayOfWeek().getDayOfWeek() != null &&
                                        s.getDayOfWeek().getDayOfWeek().name().equals(dayName))
                                .toList();
                    }
                    
                    // Check if technician has this time slot scheduled
                    boolean hasScheduleForSlot = false;
                    for (Schedule schedule : relevantSchedules) {
                        if (schedule.getTimeSlot() != null && 
                            schedule.getTimeSlot().getTimeslot() != null) {
                            TimeSlotType scheduledSlot = schedule.getTimeSlot().getTimeslot();
                            
                            // Map LocalTime to TimeSlotType and check if it matches
                            if ((slotTime.getHour() == 9 && scheduledSlot == TimeSlotType.NINE_AM) ||
                                (slotTime.getHour() == 11 && scheduledSlot == TimeSlotType.ELEVEN_AM) ||
                                (slotTime.getHour() == 13 && scheduledSlot == TimeSlotType.ONE_PM) ||
                                (slotTime.getHour() == 15 && scheduledSlot == TimeSlotType.THREE_PM) ||
                                (slotTime.getHour() == 17 && scheduledSlot == TimeSlotType.FIVE_PM)) {
                                hasScheduleForSlot = true;
                                break;
                            }
                        }
                    }
                    
                    // If technician doesn't have this slot in their schedule, skip them
                    if (!hasScheduleForSlot) {
                        continue;
                    }
                    
                    // Now check if they have any conflicting appointments
                    List<Appointment> appointmentsOnDay = appointmentRepository.findByTechnicianAndAppointmentDateBetween(
                            technician, dayStart, dayEnd).stream()
                            .filter(apt -> apt.getAppointmentStatus() != null && 
                                    apt.getAppointmentStatus().getAppointmentStatusType() != AppointmentStatusType.CANCELLED)
                            .toList();
                    
                    boolean technicianAvailable = true;
                    for (Appointment apt : appointmentsOnDay) {
                        LocalTime aptStart = apt.getAppointmentDate().toLocalTime();
                        LocalTime aptEnd = aptStart.plusMinutes(
                                apt.getJob() != null ? apt.getJob().getEstimatedDurationMinutes() : 120
                        );
                        
                        // Check for overlap with requested slot
                        if (!(slotEnd.isBefore(aptStart) || slotTime.isAfter(aptEnd))) {
                            technicianAvailable = false;
                            break;
                        }
                    }
                    
                    if (technicianAvailable) {
                        hasAvailableTechnician = true;
                        break; // Found at least one available technician
                    }
                }
                
                // Only add slot if at least one technician is available
                if (hasAvailableTechnician) {
                    // For customers, also check if they already have an appointment at this time
                    boolean customerHasConflict = false;
                    if ("customer".equalsIgnoreCase(userRole) && !customerAppointments.isEmpty()) {
                        for (Appointment customerApt : customerAppointments) {
                            LocalTime customerAptStart = customerApt.getAppointmentDate().toLocalTime();
                            LocalTime customerAptEnd = customerAptStart.plusMinutes(
                                customerApt.getJob() != null ? customerApt.getJob().getEstimatedDurationMinutes() : 60
                            );
                            
                            // Check for overlap
                            if (!(slotEnd.isBefore(customerAptStart) || slotTime.isAfter(customerAptEnd))) {
                                customerHasConflict = true;
                                break;
                            }
                        }
                    }
                    
                    // Only add if customer doesn't have a conflict
                    if (!customerHasConflict) {
                        bookedSlots.add(TechnicianBookedSlotsResponseModel.BookedSlot.builder()
                                .startTime(slotTime)
                                .endTime(slotEnd)
                                .build());
                    }
                }
            }
            
            return TechnicianBookedSlotsResponseModel.builder()
                    .technicianId("all")
                    .date(date)
                    .bookedSlots(bookedSlots)
                    .build();
        }
        
        /**
         * Auto-assign a technician based on:
         * 1. Availability at the requested time
         * 2. Least booked hours during the current week
         * 3. Random selection if all have equal hours
         */
        public Employee autoAssignTechnician(LocalDateTime appointmentDateTime, String jobName) {
            LocalDate appointmentDate = appointmentDateTime.toLocalDate();
            LocalTime appointmentTime = appointmentDateTime.toLocalTime();
            
            // Get the job to determine duration
            Job job = jobRepository.findJobByJobName(jobName);
            int jobDurationMinutes = (job != null && job.getEstimatedDurationMinutes() > 0) 
                    ? job.getEstimatedDurationMinutes() 
                    : 120;
            LocalTime appointmentEnd = appointmentTime.plusMinutes(jobDurationMinutes);
            
            // Get all active technicians
            List<Employee> technicians = employeeRepository.findAll().stream()
                    .filter(Employee::getIsActive)
                    .filter(e -> e.getEmployeeRole().getEmployeeRoleType() == EmployeeRoleType.TECHNICIAN)
                    .toList();
            
            if (technicians.isEmpty()) {
                throw new ResourceNotFoundException("No active technicians available for assignment.");
            }
            
            // Filter for technicians available at the requested time
            List<Employee> availableTechnicians = new ArrayList<>();
            LocalDateTime dayStart = appointmentDate.atStartOfDay();
            LocalDateTime dayEnd = appointmentDate.plusDays(1).atStartOfDay();
            
            for (Employee tech : technicians) {
                // FIRST: Check if technician has this time slot in their schedule
                String techId = tech.getEmployeeIdentifier().getEmployeeId();
                List<Schedule> schedules = scheduleRepository.findAllByEmployee_EmployeeIdentifier_EmployeeId(techId);
                
                // Check for date-specific schedule first
                List<Schedule> dateSpecific = scheduleRepository.findAllByEmployee_EmployeeIdentifier_EmployeeIdAndSpecificDate(techId, appointmentDate);
                List<Schedule> relevantSchedules;
                
                if (!dateSpecific.isEmpty()) {
                    relevantSchedules = dateSpecific;
                } else {
                    // Fall back to weekly schedule
                    java.time.DayOfWeek dayOfWeek = appointmentDate.getDayOfWeek();
                    String dayName = dayOfWeek.toString();
                    
                    relevantSchedules = schedules.stream()
                            .filter(s -> s.getSpecificDate() == null && s.getDayOfWeek() != null && 
                                    s.getDayOfWeek().getDayOfWeek() != null &&
                                    s.getDayOfWeek().getDayOfWeek().name().equals(dayName))
                            .toList();
                }
                
                // Check if technician has the requested time slot scheduled
                boolean hasScheduleForSlot = false;
                for (Schedule schedule : relevantSchedules) {
                    if (schedule.getTimeSlot() != null && 
                        schedule.getTimeSlot().getTimeslot() != null) {
                        TimeSlotType scheduledSlot = schedule.getTimeSlot().getTimeslot();
                        
                        // Map LocalTime to TimeSlotType and check if it matches
                        if ((appointmentTime.getHour() == 9 && scheduledSlot == TimeSlotType.NINE_AM) ||
                            (appointmentTime.getHour() == 11 && scheduledSlot == TimeSlotType.ELEVEN_AM) ||
                            (appointmentTime.getHour() == 13 && scheduledSlot == TimeSlotType.ONE_PM) ||
                            (appointmentTime.getHour() == 15 && scheduledSlot == TimeSlotType.THREE_PM) ||
                            (appointmentTime.getHour() == 17 && scheduledSlot == TimeSlotType.FIVE_PM)) {
                            hasScheduleForSlot = true;
                            break;
                        }
                    }
                }
                
                // If technician doesn't have this slot in their schedule, skip them
                if (!hasScheduleForSlot) {
                    continue;
                }
                
                // SECOND: Check for appointment conflicts at this time
                List<Appointment> appointmentsOnDay = appointmentRepository.findByTechnicianAndAppointmentDateBetween(
                        tech, dayStart, dayEnd).stream()
                        .filter(apt -> apt.getAppointmentStatus() != null && 
                                apt.getAppointmentStatus().getAppointmentStatusType() != AppointmentStatusType.CANCELLED)
                        .toList();
                
                // Check if technician is available for the requested slot
                boolean available = true;
                for (Appointment apt : appointmentsOnDay) {
                    LocalTime aptStart = apt.getAppointmentDate().toLocalTime();
                    LocalTime aptEnd = aptStart.plusMinutes(
                            apt.getJob() != null ? apt.getJob().getEstimatedDurationMinutes() : 120
                    );
                    
                    // Check for overlap
                    if (!(appointmentEnd.isBefore(aptStart) || appointmentTime.isAfter(aptEnd))) {
                        available = false;
                        break;
                    }
                }
                
                if (available) {
                    availableTechnicians.add(tech);
                }
            }
            
            if (availableTechnicians.isEmpty()) {
                throw new InvalidOperationException(
                    "No technicians available for the requested time slot: " + appointmentDateTime
                );
            }
            
            // Find the least-booked technician during the current week
            LocalDate weekStart = appointmentDate.with(java.time.temporal.TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
            LocalDate weekEnd = weekStart.plusDays(6);
            LocalDateTime weekStartDT = weekStart.atStartOfDay();
            LocalDateTime weekEndDT = weekEnd.plusDays(1).atStartOfDay();
            
            Employee leastBookedTechnician = null;
            int minHours = Integer.MAX_VALUE;
            java.util.Random random = new java.util.Random();
            
            for (Employee tech : availableTechnicians) {
                List<Appointment> weekAppointments = appointmentRepository.findByTechnicianAndAppointmentDateBetween(
                        tech, weekStartDT, weekEndDT).stream()
                        .filter(apt -> apt.getAppointmentStatus() != null && 
                                apt.getAppointmentStatus().getAppointmentStatusType() != AppointmentStatusType.CANCELLED)
                        .toList();
                
                int totalMinutes = 0;
                for (Appointment apt : weekAppointments) {
                    if (apt.getJob() != null && apt.getJob().getEstimatedDurationMinutes() > 0) {
                        totalMinutes += apt.getJob().getEstimatedDurationMinutes();
                    } else {
                        totalMinutes += 120;
                    }
                }
                
                // If this technician has fewer hours, or same hours with random chance, select them
                if (totalMinutes < minHours) {
                    minHours = totalMinutes;
                    leastBookedTechnician = tech;
                } else if (totalMinutes == minHours && random.nextBoolean()) {
                    // Equal workload - randomly select between them
                    leastBookedTechnician = tech;
                }
            }
            
            if (leastBookedTechnician == null) {
                // Fallback - just pick the first available
                leastBookedTechnician = availableTechnicians.get(0);
            }
            
            return leastBookedTechnician;
        }

        /**
         * Find an available technician for an update, balancing by weekly workload and
         * excluding the appointment being updated from conflict and workload checks.
         */
        private Employee findAvailableTechnicianForUpdate(LocalDateTime appointmentDateTime, Job job, String excludeAppointmentId) {
            List<Employee> technicians = employeeRepository.findAllByIsActiveTrue().stream()
                    .filter(Employee::getIsActive)
                    .filter(e -> e.getEmployeeRole() != null && e.getEmployeeRole().getEmployeeRoleType() == EmployeeRoleType.TECHNICIAN)
                    .toList();

            if (technicians.isEmpty()) {
                throw new ResourceNotFoundException("No active technicians available for assignment.");
            }

            List<Employee> availableTechnicians = new ArrayList<>();

            for (Employee tech : technicians) {
                try {
                    // Respect the technician's schedule for the new time
                    validationUtils.validateTechnicianSchedule(tech, appointmentDateTime);
                    // Ensure no appointment conflict, excluding the current appointment
                    validationUtils.validateTimeSlotAvailability(tech, appointmentDateTime, job, excludeAppointmentId);
                    availableTechnicians.add(tech);
                } catch (Exception ignored) {
                    // Not available, skip
                }
            }

            if (availableTechnicians.isEmpty()) {
                throw new InvalidOperationException("No technician is available at the requested time. Please choose a different date or time.");
            }

            // Choose the least-booked technician for the current week
            LocalDate appointmentDate = appointmentDateTime.toLocalDate();
            LocalDate weekStart = appointmentDate.with(java.time.temporal.TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
            LocalDate weekEnd = weekStart.plusDays(6);
            LocalDateTime weekStartDT = weekStart.atStartOfDay();
            LocalDateTime weekEndDT = weekEnd.plusDays(1).atStartOfDay();

            Employee selected = null;
            int minMinutes = Integer.MAX_VALUE;
            java.util.Random random = new java.util.Random();

            for (Employee tech : availableTechnicians) {
                List<Appointment> weekAppointments = appointmentRepository.findByTechnicianAndAppointmentDateBetween(
                        tech, weekStartDT, weekEndDT).stream()
                        .filter(apt -> apt.getAppointmentStatus() == null ||
                                apt.getAppointmentStatus().getAppointmentStatusType() != AppointmentStatusType.CANCELLED)
                        .filter(apt -> !apt.getAppointmentIdentifier().getAppointmentId().equals(excludeAppointmentId))
                        .toList();

                int totalMinutes = 0;
                for (Appointment apt : weekAppointments) {
                    if (apt.getJob() != null && apt.getJob().getEstimatedDurationMinutes() != null && apt.getJob().getEstimatedDurationMinutes() > 0) {
                        totalMinutes += apt.getJob().getEstimatedDurationMinutes();
                    } else if (apt.getJob() != null) {
                        totalMinutes += getDefaultDuration(apt.getJob().getJobType());
                    } else {
                        totalMinutes += 120;
                    }
                }

                if (totalMinutes < minMinutes) {
                    minMinutes = totalMinutes;
                    selected = tech;
                } else if (totalMinutes == minMinutes && random.nextBoolean()) {
                    // Break ties randomly to distribute load fairly
                    selected = tech;
                }
            }

            return selected != null ? selected : availableTechnicians.get(0);
        }
        
        /**
         * Get default duration in minutes for a job type when estimatedDurationMinutes is null
         */
        private int getDefaultDuration(JobType jobType) {
            return switch (jobType) {
                case QUOTATION -> 30;
                case MAINTENANCE -> 60;
                case REPARATION -> 90;
                case INSTALLATION -> 240;
            };
        }
    }
