package com.profroid.profroidapp.partsubdomain.mappingLayer;

import com.profroid.profroidapp.partsubdomain.dataAccessLayer.Part;
import com.profroid.profroidapp.partsubdomain.dataAccessLayer.PartIdentifier;
import com.profroid.profroidapp.partsubdomain.presentationLayer.PartRequestModel;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;

@Mapper(componentModel = "spring")
public interface PartRequestMapper {
    @Mappings({
            @Mapping(source = "partIdentifier", target = "partIdentifier"),

            @Mapping(source = "requestModel.name", target = "name"),
            @Mapping(source = "requestModel.available", target = "available"),
            @Mapping(target = "id", ignore = true)
    })
    Part toEntity(PartRequestModel requestModel, PartIdentifier partIdentifier);

}
