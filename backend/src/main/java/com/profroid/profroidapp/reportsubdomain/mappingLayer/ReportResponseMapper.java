package com.profroid.profroidapp.reportsubdomain.mappingLayer;

import com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.Appointment;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.Customer;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee;
import com.profroid.profroidapp.reportsubdomain.dataAccessLayer.Report;
import com.profroid.profroidapp.reportsubdomain.dataAccessLayer.ReportPart;
import com.profroid.profroidapp.reportsubdomain.presentationLayer.ReportResponseModel;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class ReportResponseMapper {

    public ReportResponseModel toResponseModel(Report report) {
        if (report == null) {
            return null;
        }

        Appointment appointment = report.getAppointment();
        Customer customer = appointment.getCustomer();
        Employee technician = appointment.getTechnician();

        // Get first phone number for customer
        String customerPhone = customer.getPhoneNumbers() != null && !customer.getPhoneNumbers().isEmpty()
                ? customer.getPhoneNumbers().get(0).getNumber()
                : null;

        // Calculate labor cost for display
        BigDecimal hourlyRateBD = BigDecimal.valueOf(appointment.getJob().getHourlyRate());
        BigDecimal laborCost = report.getHoursWorked().multiply(hourlyRateBD);

        // Calculate parts cost
        BigDecimal partsCost = report.getReportParts().stream()
                .map(rp -> rp.getPrice().multiply(BigDecimal.valueOf(rp.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Map parts
        List<ReportResponseModel.ReportPartResponseModel> partModels = report.getReportParts().stream()
                .map(this::toPartResponseModel)
                .collect(Collectors.toList());

        return ReportResponseModel.builder()
                .reportId(report.getReportIdentifier().getReportId())
                .appointmentId(appointment.getAppointmentIdentifier().getAppointmentId())
                .appointmentDate(appointment.getAppointmentDate().toString())
                .appointmentStatus(appointment.getAppointmentStatus().toString())
                .customerId(customer.getCustomerIdentifier().getCustomerId())
                .customerFirstName(customer.getFirstName())
                .customerLastName(customer.getLastName())
                .customerPhone(customerPhone)
                .technicianId(technician.getEmployeeIdentifier().getEmployeeId())
                .technicianFirstName(technician.getFirstName())
                .technicianLastName(technician.getLastName())
                .jobName(appointment.getJob().getJobName())
                .jobNameFr(appointment.getJob().getJobNameFr())
                .hourlyRate(hourlyRateBD)
                .hoursWorked(report.getHoursWorked())
                .frais(report.getFrais())
                .fraisDeplacement(report.getFraisDeplacement())
                .parts(partModels)
                .laborCost(laborCost)
                .partsCost(partsCost)
                .subtotal(report.getSubtotal())
                .tpsAmount(report.getTpsAmount())
                .tvqAmount(report.getTvqAmount())
                .total(report.getTotal())
                .createdAt(report.getCreatedAt())
                .updatedAt(report.getUpdatedAt())
                .build();
    }

    public List<ReportResponseModel> toResponseModelList(List<Report> reports) {
        if (reports == null) {
            return List.of();
        }
        return reports.stream()
                .map(this::toResponseModel)
                .collect(Collectors.toList());
    }

    private ReportResponseModel.ReportPartResponseModel toPartResponseModel(ReportPart reportPart) {
        BigDecimal totalPrice = reportPart.getPrice()
                .multiply(BigDecimal.valueOf(reportPart.getQuantity()));

        return ReportResponseModel.ReportPartResponseModel.builder()
                .partId(reportPart.getPart().getPartIdentifier().getPartId())
                .partName(reportPart.getPart().getName())
                .quantity(reportPart.getQuantity())
                .price(reportPart.getPrice())
                .totalPrice(totalPrice)
                .notes(reportPart.getNotes())
                .build();
    }
}
