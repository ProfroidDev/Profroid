package com.profroid.profroidapp.appointmentsubdomain.utils;

import com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.Appointment;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.Customer;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Helper class to build notification payload objects for appointments
 */
public class NotificationPayloadBuilder {
    
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("MMMM d, yyyy");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm:ss");
    
    /**
     * Build appointment details map for notification
     */
    public static Map<String, Object> buildAppointmentDetails(Appointment appointment) {
        Map<String, Object> details = new HashMap<>();
        
        details.put("appointmentId", 
            appointment.getAppointmentIdentifier() != null ? 
            appointment.getAppointmentIdentifier().getAppointmentId() : 
            "unknown");
        
        details.put("jobName", 
            appointment.getJob() != null ? 
            appointment.getJob().getJobName() : 
            "Not specified");
        
        details.put("technicianName", 
            appointment.getTechnician() != null ? 
            formatPersonName(appointment.getTechnician().getFirstName(), appointment.getTechnician().getLastName()) : 
            "Not assigned");
        
        details.put("customerName", 
            appointment.getCustomer() != null ? 
            formatPersonName(appointment.getCustomer().getFirstName(), appointment.getCustomer().getLastName()) : 
            "Not specified");
        
        // Format appointment date and time
        LocalDateTime appointmentDateTime = appointment.getAppointmentDate();
        if (appointmentDateTime != null) {
            details.put("appointmentDate", appointmentDateTime.format(DATE_FORMATTER));
            details.put("appointmentStartTime", appointmentDateTime.format(TIME_FORMATTER));
            
            // Calculate end time based on job duration
            if (appointment.getJob() != null && appointment.getJob().getEstimatedDurationMinutes() > 0) {
                LocalDateTime endDateTime = appointmentDateTime.plusMinutes(appointment.getJob().getEstimatedDurationMinutes());
                details.put("appointmentEndTime", endDateTime.format(TIME_FORMATTER));
            } else {
                details.put("appointmentEndTime", appointmentDateTime.plusHours(1).format(TIME_FORMATTER));
            }
        } else {
            details.put("appointmentDate", "Not specified");
            details.put("appointmentStartTime", "Not specified");
            details.put("appointmentEndTime", "Not specified");
        }
        
        // Add appointment address
        Map<String, String> address = new HashMap<>();
        if (appointment.getAppointmentAddress() != null) {
            address.put("street", appointment.getAppointmentAddress().getStreetAddress());
            address.put("city", appointment.getAppointmentAddress().getCity());
            address.put("province", appointment.getAppointmentAddress().getProvince());
            address.put("postalCode", appointment.getAppointmentAddress().getPostalCode());
        }
        details.put("appointmentAddress", address);
        
        // Add cellar info
        details.put("cellarName", 
            appointment.getCellar() != null ? 
            appointment.getCellar().getName() : 
            "Not specified");
        
        // Add description
        details.put("description", appointment.getDescription());
        
        // Add status
        if (appointment.getAppointmentStatus() != null) {
            details.put("status", appointment.getAppointmentStatus().getAppointmentStatusType().toString());
        }
        
        return details;
    }
    
    /**
     * Build list of notification recipients (customer and technician)
     * Note: Email addresses must be fetched from auth service via userId
     */
    public static List<Map<String, String>> buildRecipients(Appointment appointment) {
        List<Map<String, String>> recipients = new ArrayList<>();
        
        // Add customer recipient
        if (appointment.getCustomer() != null && appointment.getCustomer().getUserId() != null) {
            Map<String, String> customerRecipient = new HashMap<>();
            customerRecipient.put("userId", appointment.getCustomer().getUserId());
            customerRecipient.put("name", 
                formatPersonName(
                    appointment.getCustomer().getFirstName(), 
                    appointment.getCustomer().getLastName()
                ));
            customerRecipient.put("role", "customer");
            recipients.add(customerRecipient);
        }
        
        // Add technician recipient
        if (appointment.getTechnician() != null && appointment.getTechnician().getUserId() != null) {
            Map<String, String> technicianRecipient = new HashMap<>();
            technicianRecipient.put("userId", appointment.getTechnician().getUserId());
            technicianRecipient.put("name", 
                formatPersonName(
                    appointment.getTechnician().getFirstName(), 
                    appointment.getTechnician().getLastName()
                ));
            technicianRecipient.put("role", "technician");
            recipients.add(technicianRecipient);
        }
        
        return recipients;
    }
    
    /**
     * Build single recipient map for reminder notifications
     */
    public static Map<String, String> buildSingleRecipient(String email, String firstName, String lastName, String role) {
        Map<String, String> recipient = new HashMap<>();
        recipient.put("email", email);
        recipient.put("name", formatPersonName(firstName, lastName));
        recipient.put("role", role);
        return recipient;
    }
    
    /**
     * Helper method to format person name
     */
    private static String formatPersonName(String firstName, String lastName) {
        String name = "";
        if (firstName != null && !firstName.trim().isEmpty()) {
            name = firstName.trim();
        }
        if (lastName != null && !lastName.trim().isEmpty()) {
            if (!name.isEmpty()) {
                name += " " + lastName.trim();
            } else {
                name = lastName.trim();
            }
        }
        return name.isEmpty() ? "User" : name;
    }
    
    /**
     * Compare two appointments to find which fields have changed
     */
    public static List<String> detectChangedFields(Appointment original, Appointment updated) {
        List<String> changedFields = new ArrayList<>();
        
        if (original == null || updated == null) {
            return changedFields;
        }
        
        // Compare appointment date
        LocalDateTime originalDate = original.getAppointmentDate();
        LocalDateTime updatedDate = updated.getAppointmentDate();
        if (!objectsEqual(originalDate, updatedDate)) {
            changedFields.add("appointmentDate");
            changedFields.add("appointmentStartTime");
            changedFields.add("appointmentEndTime");
        }
        
        Integer originalTechId = original.getTechnician() != null ? original.getTechnician().getId() : null;
        Integer updatedTechId = updated.getTechnician() != null ? updated.getTechnician().getId() : null;
        if (!objectsEqual(originalTechId, updatedTechId)) {
            changedFields.add("technician");
        }
        
        // Compare customer
        Integer originalCustId = original.getCustomer() != null ? original.getCustomer().getId() : null;
        Integer updatedCustId = updated.getCustomer() != null ? updated.getCustomer().getId() : null;
        if (!objectsEqual(originalCustId, updatedCustId)) {
            changedFields.add("customer");
        }
        
        // Compare job
        String originalJobName = original.getJob() != null ? original.getJob().getJobName() : null;
        String updatedJobName = updated.getJob() != null ? updated.getJob().getJobName() : null;
        if (!objectsEqual(originalJobName, updatedJobName)) {
            changedFields.add("jobName");
        }
        
        // Compare description
        String originalDesc = original.getDescription() != null ? original.getDescription() : "";
        String updatedDesc = updated.getDescription() != null ? updated.getDescription() : "";
        if (!originalDesc.equals(updatedDesc)) {
            changedFields.add("description");
        }
        
        // Compare address
        if (!addressesEqual(original.getAppointmentAddress(), updated.getAppointmentAddress())) {
            changedFields.add("appointmentAddress");
        }
        
        // Compare cellar
        Integer originalCellarId = original.getCellar() != null ? original.getCellar().getId() : null;
        Integer updatedCellarId = updated.getCellar() != null ? updated.getCellar().getId() : null;
        if (!objectsEqual(originalCellarId, updatedCellarId)) {
            changedFields.add("cellarName");
        }
        
        return changedFields;
    }
    
    /**
     * Helper method to safely compare objects
     */
    private static boolean objectsEqual(Object obj1, Object obj2) {
        if (obj1 == null && obj2 == null) return true;
        if (obj1 == null || obj2 == null) return false;
        return obj1.equals(obj2);
    }
    
    /**
     * Helper to compare appointment addresses
     */
    private static boolean addressesEqual(Object addr1, Object addr2) {
        if (addr1 == addr2) return true;
        if (addr1 == null || addr2 == null) return false;
        
        // Assuming addresses have proper equals implementation
        return addr1.equals(addr2);
    }
}
