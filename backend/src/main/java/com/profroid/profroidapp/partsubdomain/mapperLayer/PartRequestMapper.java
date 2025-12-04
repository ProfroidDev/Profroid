package com.profroid.profroidapp.partsubdomain.mapperLayer;

import com.profroid.profroidapp.cellarsubdomain.dataAccessLayer.Cellar;
import com.profroid.profroidapp.cellarsubdomain.dataAccessLayer.CellarIdentifier;
import com.profroid.profroidapp.cellarsubdomain.presentationLayer.CellarRequestModel;
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
    })
    Part toEntity(PartRequestModel requestModel, PartIdentifier partIdentifier);

}
