package com.profroid.profroidapp.utils.generators.SkuGenerator;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Autowired;

@Component
public class SkuInitializer {

    @Autowired
    private SkuRepository skuRepository;

    @PostConstruct
    public void init() {
        String maxSku = skuRepository.findMaxSku();

        if (maxSku != null) {
            int numeric = Integer.parseInt(maxSku.substring(3)); // after "PC-"
            SkuGenerator.setCounter(numeric + 1);
        } else {
            SkuGenerator.setCounter(1);
        }

        System.out.println("SKU Generator initialized. Next SKU = " + SkuGenerator.getCounter());
    }
}
