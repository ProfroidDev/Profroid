package com.profroid.profroidapp.partsubdomain.presentationLayer;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class PartRequestModel {
    private String name;
    private String category;
    private Integer quantity;
    private BigDecimal price;
    private String supplier;
    private Integer lowStockThreshold;
    private Integer outOfStockThreshold;
    private Integer highStockThreshold;
    private Boolean available;
}
