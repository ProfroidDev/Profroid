package com.profroid.profroidapp.partsubdomain.mapperLayer;

import com.profroid.profroidapp.cellarsubdomain.dataAccessLayer.Cellar;
import com.profroid.profroidapp.cellarsubdomain.presentationLayer.CellarResponseModel;
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

    })
    PartResponseModel toResponseModel(Part part);

    List<PartResponseModel> toResponseModelList(List<Part> parts);
}
