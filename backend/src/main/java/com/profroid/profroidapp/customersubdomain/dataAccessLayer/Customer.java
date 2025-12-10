package com.profroid.profroidapp.customersubdomain.dataAccessLayer;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Entity
@Table(name = "customers")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Embedded
    @AttributeOverride(
            name = "customerId",
            column = @Column(name = "customer_id", nullable = false, unique = true)
    )
    private CustomerIdentifier customerIdentifier;

    private String firstName;
    private String lastName;

    @ElementCollection
    @CollectionTable(name = "customer_phonenumbers", joinColumns = @JoinColumn(name = "customer_id"))
    private List<CustomerPhoneNumber> phoneNumbers;

    @Embedded
    private CustomerAddress customerAddress;

    private String userId;

    private Boolean isActive;
}
