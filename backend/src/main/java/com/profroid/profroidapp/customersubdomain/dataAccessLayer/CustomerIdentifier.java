package com.profroid.profroidapp.customersubdomain.dataAccessLayer;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.UUID;

@Embeddable
@Getter
@AllArgsConstructor
public class CustomerIdentifier {
    private String customerId;

    public CustomerIdentifier() {
        this.customerId = UUID.randomUUID().toString();
    }
}
