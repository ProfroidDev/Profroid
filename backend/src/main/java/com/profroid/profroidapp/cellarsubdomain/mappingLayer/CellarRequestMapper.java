package com.profroid.profroidapp.cellarsubdomain.mappingLayer;

import com.profroid.profroidapp.cellarsubdomain.dataAccessLayer.Cellar;
import com.profroid.profroidapp.cellarsubdomain.dataAccessLayer.CellarIdentifier;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.CustomerIdentifier;
import com.profroid.profroidapp.cellarsubdomain.presentationLayer.CellarRequestModel;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;

@Mapper(componentModel = "spring")
public interface CellarRequestMapper {

    @Mappings({
            @Mapping(source = "cellarIdentifier", target = "cellarIdentifier"),

            // IMPORTANT: ignore JPA join field
            @Mapping(target = "ownerCustomer", ignore = true),

            // Creates the VO from the incoming string
            @Mapping(source = "requestModel.ownerCustomerId",
                    target = "ownerCustomerIdentifier"),

            @Mapping(source = "requestModel.name", target = "name"),
            @Mapping(source = "requestModel.height", target = "height"),
            @Mapping(source = "requestModel.width", target = "width"),
            @Mapping(source = "requestModel.depth", target = "depth"),

            @Mapping(source = "requestModel.bottleCapacity", target = "bottleCapacity"),
            @Mapping(source = "requestModel.hasCoolingSystem", target = "hasCoolingSystem"),
            @Mapping(source = "requestModel.hasHumidityControl", target = "hasHumidityControl"),
            @Mapping(source = "requestModel.hasAutoRegulation", target = "hasAutoRegulation"),

            @Mapping(source = "requestModel.cellarType", target = "cellarType"),

            // JPA auto key
            @Mapping(target = "id", ignore = true)
    })
    Cellar toEntity(CellarRequestModel requestModel, CellarIdentifier cellarIdentifier);
}
