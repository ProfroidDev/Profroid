package com.profroid.profroidapp.customersubdomain.dataAccessLayer;

import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Embeddable
@Getter
@NoArgsConstructor
public class CustomerPhoneNumber {

    @Enumerated(EnumType.STRING)
    private PhoneType type;
    private String number;

    public CustomerPhoneNumber(@NotNull PhoneType type,@NotNull String number) {
        this.type = type;
        this.number = number;
    }
}
