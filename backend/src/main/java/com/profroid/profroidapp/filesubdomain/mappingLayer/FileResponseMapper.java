package com.profroid.profroidapp.filesubdomain.mappingLayer;

import com.profroid.profroidapp.filesubdomain.dataAccessLayer.StoredFile;
import com.profroid.profroidapp.filesubdomain.presentationLayer.FileResponseModel;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;

import java.util.List;

@Mapper(componentModel = "spring")
public interface FileResponseMapper {
    @Mappings({
            @Mapping(source = "id", target = "fileId"),
            @Mapping(source = "ownerType", target = "ownerType"),
            @Mapping(source = "ownerId", target = "ownerId"),
            @Mapping(source = "category", target = "category"),
            @Mapping(source = "originalFilename", target = "originalFilename"),
            @Mapping(source = "contentType", target = "contentType"),
            @Mapping(source = "sizeBytes", target = "sizeBytes"),
            @Mapping(source = "createdAt", target = "createdAt")
    })
    FileResponseModel toResponseModel(StoredFile file);

    List<FileResponseModel> toResponseModelList(List<StoredFile> files);
}
