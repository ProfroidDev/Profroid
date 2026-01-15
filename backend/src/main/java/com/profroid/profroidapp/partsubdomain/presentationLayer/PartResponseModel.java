package com.profroid.profroidapp.partsubdomain.presentationLayer;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class PartResponseModel {
    private String partId;
    private String name;
    private String category;
    private Integer quantity;
    private BigDecimal price;
    private String supplier;
    private Integer lowStockThreshold;
    private Integer outOfStockThreshold;
    private Integer highStockThreshold;
    private String status;
    private Boolean available;
    private String imageFileId;
}
