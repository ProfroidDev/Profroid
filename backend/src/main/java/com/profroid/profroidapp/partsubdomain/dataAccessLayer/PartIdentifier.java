package com.profroid.profroidapp.partsubdomain.dataAccessLayer;

import com.profroid.profroidapp.utils.generators.SkuGenerator;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Embeddable
@Getter
@AllArgsConstructor
public class PartIdentifier {
    private String partId;

    public PartIdentifier() {
        this.partId = SkuGenerator.generateSku();
    }
}
