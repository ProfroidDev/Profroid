package com.profroid.profroidapp.partsubdomain.businessLayer;

import com.profroid.profroidapp.partsubdomain.presentationLayer.PartRequestModel;
import com.profroid.profroidapp.partsubdomain.presentationLayer.PartResponseModel;

import java.util.List;

public interface PartService {
    List<PartResponseModel> getAllParts();
    PartResponseModel getPartById(String partId);
    PartResponseModel createPart(PartRequestModel partRequestModel);
    PartResponseModel updatePart(String partId, PartRequestModel partRequestModel);
    void deletePart(String partId);
}
