package com.profroid.profroidapp.customersubdomain.dataAccessLayer;

import jakarta.persistence.*;
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
    private CustomerIdentifier customerIdentifier;

    private String firstName;
    private String lastName;
    private String email;
    private String password;

    @ElementCollection
    @CollectionTable(name = "customer_phonenumbers", joinColumns = @JoinColumn(name = "customer_id"))
    private List<CustomerPhoneNumber> phoneNumbers;

    @Embedded
    private CustomerAddress customerAddress;

    public Customer(String firstName, String lastName,
                    String email, String password, List<CustomerPhoneNumber> phoneNumbersList, CustomerAddress customerAddress) {
        this.customerIdentifier = new CustomerIdentifier();
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.password = password;
        this.phoneNumbers = phoneNumbersList;
    }
}
