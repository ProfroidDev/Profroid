package com.profroid.profroidapp.customersubdomain.dataAccessLayer;

import com.profroid.profroidapp.cellarsubdomain.dataAccessLayer.Cellar;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Cascade;

import java.util.ArrayList;
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

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "customer_phonenumbers", joinColumns = @JoinColumn(name = "customer_id"))
    @Cascade(org.hibernate.annotations.CascadeType.ALL)
    private List<CustomerPhoneNumber> phoneNumbers;

    @Embedded
    private CustomerAddress customerAddress;

    private String userId;

    private Boolean isActive;

    @OneToMany(mappedBy = "ownerCustomer", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Cellar> cellars = new ArrayList<>();
}
