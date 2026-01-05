package com.profroid.profroidapp.partsubdomain.businessLayer;

import com.profroid.profroidapp.partsubdomain.presentationLayer.PartRequestModel;
import com.profroid.profroidapp.partsubdomain.presentationLayer.PartResponseModel;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface PartService {
    List<PartResponseModel> getAllParts();
    PartResponseModel getPartById(String partId);
    PartResponseModel createPart(PartRequestModel partRequestModel);
    PartResponseModel updatePart(String partId, PartRequestModel partRequestModel);
    void deletePart(String partId);
    PartResponseModel uploadPartImage(String partId, MultipartFile file);
    PartResponseModel createPartWithImage(PartRequestModel requestModel, MultipartFile file);
}
