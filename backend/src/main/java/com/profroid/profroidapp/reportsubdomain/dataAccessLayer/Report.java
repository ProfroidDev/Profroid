package com.profroid.profroidapp.reportsubdomain.dataAccessLayer;

import com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.Appointment;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "reports")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @NotNull
    @Embedded
    private ReportIdentifier reportIdentifier;

    // Link to the appointment this report is for
    @NotNull
    @OneToOne
    @JoinColumn(name = "appointment_id", unique = true)
    private Appointment appointment;

    // Work details
    @NotNull
    @Column(name = "hours_worked", precision = 10, scale = 2)
    private BigDecimal hoursWorked;

    @NotNull
    @Column(name = "frais", precision = 10, scale = 2)
    private BigDecimal frais; // General fees/costs

    @NotNull
    @Column(name = "frais_deplacement", precision = 10, scale = 2)
    private BigDecimal fraisDeplacement; // Travel costs

    // Parts used in this job
    @OneToMany(mappedBy = "report", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ReportPart> reportParts = new ArrayList<>();

    // Calculated totals
    @NotNull
    @Column(name = "subtotal", precision = 10, scale = 2)
    private BigDecimal subtotal; // Before taxes

    @NotNull
    @Column(name = "tps_amount", precision = 10, scale = 2)
    private BigDecimal tpsAmount; // TPS 5%

    @NotNull
    @Column(name = "tvq_amount", precision = 10, scale = 2)
    private BigDecimal tvqAmount; // TVQ 9.975%

    @NotNull
    @Column(name = "total", precision = 10, scale = 2)
    private BigDecimal total; // Final total with taxes

    @NotNull
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
