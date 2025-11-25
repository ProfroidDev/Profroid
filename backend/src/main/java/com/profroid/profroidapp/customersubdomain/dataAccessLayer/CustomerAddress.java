package com.profroid.profroidapp.customersubdomain.dataAccessLayer;

import jakarta.persistence.Embeddable;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Embeddable
@NoArgsConstructor
@Getter
@Setter
@Builder
public class CustomerAddress {
    private String streetAddress;
    private String city;
    private String province;
    private String country;
    private String postalCode;

    public CustomerAddress(String streetAddress, String city, String province, String country, String postalCode) {
        this.streetAddress = streetAddress;
        this.city = city;
        this.province = province;
        this.country = country;
        this.postalCode = postalCode;
    }
}
