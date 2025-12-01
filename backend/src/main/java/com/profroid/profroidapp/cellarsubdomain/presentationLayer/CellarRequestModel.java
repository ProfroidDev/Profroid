package com.profroid.profroidapp.cellarsubdomain.presentationLayer;

import com.profroid.profroidapp.cellarsubdomain.dataAccessLayer.CellarType;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.CustomerIdentifier;
import lombok.Data;

@Data
public class CellarRequestModel {

    private CustomerIdentifier ownerCustomerId;

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
