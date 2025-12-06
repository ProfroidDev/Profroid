package com.profroid.profroidapp.cellarsubdomain.businessLayer;

import com.profroid.profroidapp.cellarsubdomain.dataAccessLayer.Cellar;
import com.profroid.profroidapp.cellarsubdomain.dataAccessLayer.CellarIdentifier;
import com.profroid.profroidapp.cellarsubdomain.dataAccessLayer.CellarRepository;
import com.profroid.profroidapp.cellarsubdomain.mappingLayer.CellarRequestMapper;
import com.profroid.profroidapp.cellarsubdomain.mappingLayer.CellarResponseMapper;
import com.profroid.profroidapp.cellarsubdomain.presentationLayer.CellarRequestModel;
import com.profroid.profroidapp.cellarsubdomain.presentationLayer.CellarResponseModel;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.Customer;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.CustomerRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CellarServiceImpl implements CellarService {

    private final CellarRepository cellarRepository;
    private final CellarResponseMapper cellarResponseMapper;
    private final CellarRequestMapper cellarRequestMapper;
    private final CustomerRepository customerRepository;

    public CellarServiceImpl(CellarRepository cellarRepository,
                             CellarResponseMapper cellarResponseMapper,
                             CellarRequestMapper cellarRequestMapper,
                             CustomerRepository customerRepository) {
        this.cellarRepository = cellarRepository;
        this.cellarResponseMapper = cellarResponseMapper;
        this.cellarRequestMapper = cellarRequestMapper;
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

        // 1. Validate that the customer exists
        Customer ownerCustomer = customerRepository
                .findCustomerByCustomerIdentifier_CustomerId(ownerCustomerId);

        if (ownerCustomer == null) {
            throw new EntityNotFoundException("Customer not found: " + ownerCustomerId);
        }

        // 2. Create new CellarIdentifier
        CellarIdentifier cellarIdentifier = new CellarIdentifier();

        // 3. Map request model to entity
        Cellar cellar = cellarRequestMapper.toEntity(cellarRequestModel, cellarIdentifier);

        // 4. Save to database
        Cellar savedCellar = cellarRepository.save(cellar);

        // 5. Map to response model and return
        return cellarResponseMapper.toResponseModel(savedCellar);
    }

    @Override
    public CellarResponseModel updateCellar(String ownerCustomerId, String cellarId, CellarRequestModel cellarRequestModel) {
        return null;
    }

    @Override
    public void deleteCellar(String ownerCustomerId, String cellarId) {

    }
}
