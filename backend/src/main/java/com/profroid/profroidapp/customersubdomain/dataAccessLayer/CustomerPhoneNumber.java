package com.profroid.profroidapp.customersubdomain.dataAccessLayer;

import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Embeddable
@Data
@NoArgsConstructor
public class CustomerPhoneNumber {

    @Enumerated(EnumType.STRING)
    private PhoneType type;
    private String number;

}
