package com.profroid.profroidapp.customersubdomain.dataAccessLayer;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Entity
@Table(name = "customers")
@Data
@NoArgsConstructor
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

    public Customer(@NotNull String firstName, @NotNull String lastName,
                    @NotNull List<CustomerPhoneNumber> phoneNumbersList, @NotNull CustomerAddress customerAddress, String userId) {
        this.customerIdentifier = new CustomerIdentifier();
        this.firstName = firstName;
        this.lastName = lastName;
        this.phoneNumbers = phoneNumbersList;
        this.userId = userId;
        this.customerAddress = customerAddress;
    }
}
