package com.profroid.profroidapp.partsubdomain.presentationLayer;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PartResponseModel {
    private String partId;
    private String name;
    private Boolean available;
}
