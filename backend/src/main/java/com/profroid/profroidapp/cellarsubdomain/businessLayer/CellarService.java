package com.profroid.profroidapp.cellarsubdomain.businessLayer;

import com.profroid.profroidapp.cellarsubdomain.presentationLayer.CellarRequestModel;
import com.profroid.profroidapp.cellarsubdomain.presentationLayer.CellarResponseModel;

import java.util.List;

public interface CellarService {

    List<CellarResponseModel> getAllCellars();
    CellarResponseModel getCellarById(String cellarId);
    List<CellarResponseModel> getAllCellars(String ownerCustomerId);
    List<CellarResponseModel> getAllCellarsForUser(String userId);

    CellarResponseModel getCellarById(String ownerCustomerId, String cellarId);

    CellarResponseModel createCellar(String ownerCustomerId, CellarRequestModel cellarRequestModel);

    CellarResponseModel updateCellar(String ownerCustomerId, String cellarId, CellarRequestModel cellarRequestModel);

    CellarResponseModel deleteCellar(String cellarId);

    CellarResponseModel reactivateCellar(String cellarId);
}
