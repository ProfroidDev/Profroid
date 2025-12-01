package com.profroid.profroidapp.cellarsubdomain.mappingLayer;

import com.profroid.profroidapp.cellarsubdomain.dataAccessLayer.Cellar;
import com.profroid.profroidapp.cellarsubdomain.presentationLayer.CellarResponseModel;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;

import java.util.List;

@Mapper(componentModel = "spring")
public interface CellarResponseMapper {

    @Mappings({
            @Mapping(source = "cellar.cellarIdentifier.cellarId", target = "cellarId"),
            @Mapping(source = "cellar.ownerCustomerIdentifier.customerId", target = "ownerCustomerId"),

            @Mapping(source = "cellar.name", target = "name"),

            @Mapping(source = "cellar.height", target = "height"),
            @Mapping(source = "cellar.width", target = "width"),
            @Mapping(source = "cellar.depth", target = "depth"),

            @Mapping(source = "cellar.bottleCapacity", target = "bottleCapacity"),

            @Mapping(source = "cellar.hasCoolingSystem", target = "hasCoolingSystem"),
            @Mapping(source = "cellar.hasHumidityControl", target = "hasHumidityControl"),
            @Mapping(source = "cellar.hasAutoRegulation", target = "hasAutoRegulation"),

            @Mapping(source = "cellar.cellarType", target = "cellarType")
    })
    CellarResponseModel toResponseModel(Cellar cellar);

    List<CellarResponseModel> toResponseModelList(List<Cellar> cellars);
}
