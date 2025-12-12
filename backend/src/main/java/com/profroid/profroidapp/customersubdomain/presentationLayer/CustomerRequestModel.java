package com.profroid.profroidapp.customersubdomain.presentationLayer;

import com.profroid.profroidapp.customersubdomain.dataAccessLayer.CustomerPhoneNumber;
import jakarta.annotation.Nullable;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CustomerRequestModel {
    @NotBlank(message = "First name is required and cannot be empty")
    String firstName;
    
    @NotBlank(message = "Last name is required and cannot be empty")
    String lastName;
    
    List<CustomerPhoneNumber> phoneNumbers;

    @NotBlank(message = "Street address is required and cannot be empty")
    String streetAddress;
    
    @NotBlank(message = "City is required and cannot be empty")
    String city;
    
    @NotBlank(message = "Province is required and cannot be empty")
    String province;
    
    @NotBlank(message = "Country is required and cannot be empty")
    String country;
    
    @NotBlank(message = "Postal code is required and cannot be empty")
    String postalCode;
    
    @NotBlank(message = "User ID is required and cannot be empty")
    String userId;
}
