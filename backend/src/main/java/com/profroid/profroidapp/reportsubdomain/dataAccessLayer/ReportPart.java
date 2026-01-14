package com.profroid.profroidapp.reportsubdomain.dataAccessLayer;

import com.profroid.profroidapp.partsubdomain.dataAccessLayer.Part;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Junction entity representing parts used in a report
 * Allows manual price override for each part in the context of this specific report
 */
@Entity
@Table(name = "report_parts")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ReportPart {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @NotNull
    @ManyToOne
    @JoinColumn(name = "report_id")
    private Report report;

    @NotNull
    @ManyToOne
    @JoinColumn(name = "part_id")
    private Part part;

    @NotNull
    @Column(name = "quantity")
    private Integer quantity;

    // Manual price set by technician for this specific report
    @NotNull
    @Column(name = "price", precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "notes")
    private String notes; // Optional notes about this part usage
}
