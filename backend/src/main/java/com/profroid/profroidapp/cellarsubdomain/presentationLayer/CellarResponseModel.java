package com.profroid.profroidapp.cellarsubdomain.presentationLayer;

import com.profroid.profroidapp.cellarsubdomain.dataAccessLayer.CellarType;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CellarResponseModel {

    private String cellarId;
    private String ownerCustomerId;

    private String name;

    private double height;
    private double width;
    private double depth;

    private Integer bottleCapacity;

    private boolean hasCoolingSystem;
    private boolean hasHumidityControl;
    private boolean hasAutoRegulation;

    private CellarType cellarType;
}
