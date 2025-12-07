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
import com.profroid.profroidapp.utils.exceptions.InvalidIdentifierException;
import com.profroid.profroidapp.utils.exceptions.InvalidOperationException;
import com.profroid.profroidapp.utils.exceptions.ResourceNotFoundException;
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

        if (cellarId == null || cellarId.trim().length() != 36) {
            throw new InvalidIdentifierException("Cellar ID must be a 36-character UUID string.");
        }

        Cellar cellar = cellarRepository.findCellarByCellarIdentifier_CellarId(cellarId);

        if (cellar == null) {
            throw new ResourceNotFoundException("Cellar " + cellarId + " not found.");
        }

        return cellarResponseMapper.toResponseModel(cellar);
    }

    @Override
    public List<CellarResponseModel> getAllCellars(String ownerCustomerId) {

        if (ownerCustomerId == null || ownerCustomerId.trim().length() != 36) {
            throw new InvalidIdentifierException("Customer ID must be a 36-character UUID string.");
        }

        Customer customer =
                customerRepository.findCustomerByCustomerIdentifier_CustomerId(ownerCustomerId);

        if (customer == null) {
            throw new ResourceNotFoundException("Customer " + ownerCustomerId + " not found.");
        }

        List<Cellar> cellars =
                cellarRepository.findByOwnerCustomerIdentifier(customer.getCustomerIdentifier());

        return cellarResponseMapper.toResponseModelList(cellars);
    }

    @Override
    public CellarResponseModel getCellarById(String ownerCustomerId, String cellarId) {

        if (ownerCustomerId == null || ownerCustomerId.trim().length() != 36) {
            throw new InvalidIdentifierException("Customer ID must be a 36-character UUID string.");
        }

        if (cellarId == null || cellarId.trim().length() != 36) {
            throw new InvalidIdentifierException("Cellar ID must be a 36-character UUID string.");
        }

        Customer customer =
                customerRepository.findCustomerByCustomerIdentifier_CustomerId(ownerCustomerId);

        if (customer == null) {
            throw new ResourceNotFoundException("Customer " + ownerCustomerId + " not found.");
        }

        Cellar cellar =
                cellarRepository.findCellarByCellarIdentifier_CellarId(cellarId);

        if (cellar == null) {
            throw new ResourceNotFoundException("Cellar " + cellarId + " not found.");
        }

        // ownership check
        if (!cellar.getOwnerCustomer().getCustomerIdentifier().getCustomerId()
                .equals(ownerCustomerId)) {

            throw new InvalidOperationException(
                    "Cellar " + cellarId + " does not belong to customer " + ownerCustomerId + "."
            );
        }

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

        // 1. Validate customer ID format
        if (ownerCustomerId == null || ownerCustomerId.trim().length() != 36) {
            throw new InvalidIdentifierException("Customer ID must be a 36-character UUID string.");
        }

        // 2. Validate cellar ID format
        if (cellarId == null || cellarId.trim().length() != 36) {
            throw new InvalidIdentifierException("Cellar ID must be a 36-character UUID string.");
        }

        // 3. Check if customer exists
        Customer customer = customerRepository.findCustomerByCustomerIdentifier_CustomerId(ownerCustomerId);
        if (customer == null) {
            throw new ResourceNotFoundException("Customer " + ownerCustomerId + " not found.");
        }

        // 4. Find the cellar
        Cellar foundCellar = cellarRepository.findCellarByCellarIdentifier_CellarId(cellarId);
        if (foundCellar == null) {
            throw new ResourceNotFoundException("Cellar " + cellarId + " not found.");
        }

        // 5. Verify ownership
        if (!foundCellar.getOwnerCustomerIdentifier().getCustomerId().equals(ownerCustomerId)) {
            throw new InvalidOperationException(
                    "Cellar " + cellarId + " does not belong to customer " + ownerCustomerId + "."
            );
        }

        // 6. Update all cellar fields
        foundCellar.setName(cellarRequestModel.getName());
        foundCellar.setHeight(cellarRequestModel.getHeight());
        foundCellar.setWidth(cellarRequestModel.getWidth());
        foundCellar.setDepth(cellarRequestModel.getDepth());
        foundCellar.setBottleCapacity(cellarRequestModel.getBottleCapacity());
        foundCellar.setHasCoolingSystem(cellarRequestModel.isHasCoolingSystem());
        foundCellar.setHasHumidityControl(cellarRequestModel.isHasHumidityControl());
        foundCellar.setHasAutoRegulation(cellarRequestModel.isHasAutoRegulation());
        foundCellar.setCellarType(cellarRequestModel.getCellarType());

        // 7. Save and return
        Cellar updatedCellar = cellarRepository.save(foundCellar);
        return cellarResponseMapper.toResponseModel(updatedCellar);
    }

    @Override
    public void deleteCellar(String ownerCustomerId, String cellarId) {

    }
}
