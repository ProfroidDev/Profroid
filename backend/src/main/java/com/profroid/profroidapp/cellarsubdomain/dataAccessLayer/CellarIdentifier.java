package com.profroid.profroidapp.cellarsubdomain.dataAccessLayer;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Embeddable
@Getter
@AllArgsConstructor
public class CellarIdentifier {
    private String cellarId;

    public CellarIdentifier() {
        this.cellarId = java.util.UUID.randomUUID().toString();
    }
}
