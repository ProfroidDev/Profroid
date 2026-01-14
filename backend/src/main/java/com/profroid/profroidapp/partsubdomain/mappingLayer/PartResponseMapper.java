package com.profroid.profroidapp.partsubdomain.mappingLayer;

import com.profroid.profroidapp.partsubdomain.dataAccessLayer.Part;
import com.profroid.profroidapp.partsubdomain.presentationLayer.PartResponseModel;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;

import java.util.List;

@Mapper(componentModel = "spring")
public interface PartResponseMapper {
    @Mappings({
            @Mapping(source = "part.partIdentifier.partId", target = "partId"),
            @Mapping(source = "part.name", target = "name"),
            @Mapping(source = "part.category", target = "category"),
            @Mapping(source = "part.quantity", target = "quantity"),
            @Mapping(source = "part.price", target = "price"),
            @Mapping(source = "part.supplier", target = "supplier"),
            @Mapping(source = "part.lowStockThreshold", target = "lowStockThreshold"),
            @Mapping(source = "part.outOfStockThreshold", target = "outOfStockThreshold"),
            @Mapping(source = "part.highStockThreshold", target = "highStockThreshold"),
            @Mapping(expression = "java(part.getStatus())", target = "status"),
            @Mapping(source = "part.available", target = "available"),
            @Mapping(source = "part.imageFileId", target = "imageFileId")
    })
    PartResponseModel toResponseModel(Part part);

    List<PartResponseModel> toResponseModelList(List<Part> parts);
}
