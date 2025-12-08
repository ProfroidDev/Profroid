package com.profroid.profroidapp.partsubdomain.presentationLayer;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PartRequestModel {
    private String name;
    private Boolean available;
}
