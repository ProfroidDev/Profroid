package com.profroid.profroidapp.cellarsubdomain.businessLayer;

import com.profroid.profroidapp.cellarsubdomain.dataAccessLayer.Cellar;
import com.profroid.profroidapp.cellarsubdomain.dataAccessLayer.CellarRepository;
import com.profroid.profroidapp.cellarsubdomain.mappingLayer.CellarResponseMapper;
import com.profroid.profroidapp.cellarsubdomain.presentationLayer.CellarRequestModel;
import com.profroid.profroidapp.cellarsubdomain.presentationLayer.CellarResponseModel;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.Customer;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.CustomerIdentifier;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.CustomerRepository;
import org.springframework.data.crossstore.ChangeSetPersister;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CellarServiceImpl implements CellarService {

    private final CellarRepository cellarRepository;
    private final CellarResponseMapper cellarResponseMapper;
    private final CustomerRepository customerRepository;

    public CellarServiceImpl(CellarRepository cellarRepository,
                             CellarResponseMapper cellarResponseMapper, CustomerRepository customerRepository) {
        this.cellarRepository = cellarRepository;
        this.cellarResponseMapper = cellarResponseMapper;
        this.customerRepository = customerRepository;
    }

    @Override
    public List<CellarResponseModel> getAllCellars() {
        List<Cellar> cellars = cellarRepository.findAll();
        return cellarResponseMapper.toResponseModelList(cellars);
    }

    @Override
    public CellarResponseModel getCellarById(String cellarId) {
        Cellar cellar = cellarRepository
                .findCellarByCellarIdentifier_CellarId(cellarId);
        return cellarResponseMapper.toResponseModel(cellar);
    }

    @Override
    public List<CellarResponseModel> getAllCellars(String ownerCustomerId) {

        // 1. Validate that the customer exists
        Customer ownerCustomer = customerRepository
                .findCustomerByCustomerIdentifier_CustomerId(ownerCustomerId);

        // 2. Fetch cellars belonging to this customer
        List<Cellar> cellars = cellarRepository
                .findByOwnerCustomerIdentifier(ownerCustomer.getCustomerIdentifier());

        // 3. Map to response models
        return cellarResponseMapper.toResponseModelList(cellars);
    }

    @Override
    public CellarResponseModel getCellarById(String ownerCustomerId, String cellarId) {

        Customer ownerCustomer = customerRepository
                .findCustomerByCustomerIdentifier_CustomerId(ownerCustomerId);

        Cellar cellar = cellarRepository
                .findCellarByCellarIdentifier_CellarId(cellarId);

        return cellarResponseMapper.toResponseModel(cellar);
    }

    @Override
    public CellarResponseModel createCellar(String ownerCustomerId, CellarRequestModel cellarRequestModel) {
        return null;
    }

    @Override
    public CellarResponseModel updateCellar(String ownerCustomerId, String cellarId, CellarRequestModel cellarRequestModel) {
        return null;
    }

    @Override
    public void deleteCellar(String ownerCustomerId, String cellarId) {

    }
}
