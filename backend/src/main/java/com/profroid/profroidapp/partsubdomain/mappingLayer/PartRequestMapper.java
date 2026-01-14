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
            @Mapping(source = "requestModel.category", target = "category"),
            @Mapping(source = "requestModel.quantity", target = "quantity"),
            @Mapping(source = "requestModel.price", target = "price"),
            @Mapping(source = "requestModel.supplier", target = "supplier"),
            @Mapping(source = "requestModel.lowStockThreshold", target = "lowStockThreshold"),
            @Mapping(source = "requestModel.outOfStockThreshold", target = "outOfStockThreshold"),
            @Mapping(source = "requestModel.highStockThreshold", target = "highStockThreshold"),
            @Mapping(source = "requestModel.available", target = "available"),
            @Mapping(target = "id", ignore = true),
            @Mapping(target = "imageFileId", ignore = true)
    })
    Part toEntity(PartRequestModel requestModel, PartIdentifier partIdentifier);

}
