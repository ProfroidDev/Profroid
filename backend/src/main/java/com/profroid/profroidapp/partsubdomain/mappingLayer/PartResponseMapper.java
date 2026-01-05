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
                @Mapping(source = "part.available", target = "available"),
                @Mapping(source = "part.imageFileId", target = "imageFileId")

    })
    PartResponseModel toResponseModel(Part part);

    List<PartResponseModel> toResponseModelList(List<Part> parts);
}
