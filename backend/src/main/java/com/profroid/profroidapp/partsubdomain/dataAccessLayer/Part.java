package com.profroid.profroidapp.partsubdomain.dataAccessLayer;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "parts")
@Data
@NoArgsConstructor
public class Part {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Embedded
    private PartIdentifier partIdentifier;

    private String name;

    private String category;
    
    @Column(nullable = false)
    private Integer quantity;
    
    @Column(precision = 10, scale = 2)
    private BigDecimal price;
    
    private String supplier;
    
    @Column(name = "low_stock_threshold")
    private Integer lowStockThreshold = 5;
    
    @Column(name = "out_of_stock_threshold")
    private Integer outOfStockThreshold = 0;
    
    @Column(name = "high_stock_threshold")
    private Integer highStockThreshold = 50;
    
    private Boolean available;

    @Column(name = "image_file_id")
    private UUID imageFileId;
    
    // Derived status based on quantity and thresholds
    @Transient
    public String getStatus() {
        if (quantity == null) return "Out of Stock";
        if (quantity <= outOfStockThreshold) return "Out of Stock";
        if (quantity <= lowStockThreshold) return "Low Stock";
        return "In Stock";
    }
}
