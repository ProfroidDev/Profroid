package com.profroid.profroidapp.cellarsubdomain.dataAccessLayer;

import com.profroid.profroidapp.customersubdomain.dataAccessLayer.Customer;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.CustomerIdentifier;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Table(name = "cellars")
@Data
@NoArgsConstructor
public class Cellar {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Embedded
    private CellarIdentifier cellarIdentifier;

    @Embedded
    @AttributeOverride(
            name = "customerId",
            column = @Column(name = "owner_customer_id", nullable = false)
    )
    private CustomerIdentifier ownerCustomerIdentifier;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "owner_customer_id",
            referencedColumnName = "customer_id",
            insertable = false,
            updatable = false
    )
    @ToString.Exclude
    private Customer ownerCustomer;


    private String name;

    private double height;
    private double width;
    private double depth;

    private Integer bottleCapacity;

    private boolean hasCoolingSystem;
    private boolean hasHumidityControl;
    private boolean hasAutoRegulation;

    @Enumerated(EnumType.STRING)
    private CellarType cellarType;

    private Boolean isActive = true;
    
    private Boolean isDeleted = false;
}

