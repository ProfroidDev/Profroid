package com.profroid.profroidapp.customersubdomain.presentationLayer;

import com.profroid.profroidapp.customersubdomain.dataAccessLayer.CustomerPhoneNumber;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CustomerResponseModel {
    String customerId;
    String firstName;
    String lastName;
    String email;
    String password;
    List<CustomerPhoneNumber> phoneNumbers;

    String streetAddress;
    String city;
    String province;
    String country;
    String postalCode;
}
