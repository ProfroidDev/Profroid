package com.profroid.profroidapp.partsubdomain.businessLayer;

import com.profroid.profroidapp.partsubdomain.dataAccessLayer.Part;
import com.profroid.profroidapp.partsubdomain.dataAccessLayer.PartIdentifier;
import com.profroid.profroidapp.partsubdomain.dataAccessLayer.PartRepository;
import com.profroid.profroidapp.partsubdomain.mapperLayer.PartRequestMapper;
import com.profroid.profroidapp.partsubdomain.mapperLayer.PartResponseMapper;
import com.profroid.profroidapp.partsubdomain.presentationLayer.PartRequestModel;
import com.profroid.profroidapp.partsubdomain.presentationLayer.PartResponseModel;
import com.profroid.profroidapp.utils.exceptions.InvalidIdentifierException;
import com.profroid.profroidapp.utils.exceptions.ResourceAlreadyExistsException;
import com.profroid.profroidapp.utils.exceptions.ResourceNotFoundException;
import com.profroid.profroidapp.utils.exceptions.InvalidOperationException;
import com.profroid.profroidapp.utils.generators.SkuGenerator.SkuGenerator;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PartServiceImpl implements PartService {

    private final PartRepository partRepository;
    private final PartResponseMapper partResponseMapper;
    private final PartRequestMapper partRequestMapper;

    public PartServiceImpl(PartRepository partRepository,
                           PartResponseMapper partResponseMapper,
                           PartRequestMapper partRequestMapper) {
        this.partRepository = partRepository;
        this.partResponseMapper = partResponseMapper;
        this.partRequestMapper = partRequestMapper;
    }

    // =====================================================
    // GET ALL PARTS
    // =====================================================
    @Override
    public List<PartResponseModel> getAllParts() {
        List<Part> parts = partRepository.findAll();
        return partResponseMapper.toResponseModelList(parts);
    }

    // =====================================================
    // GET PART BY ID
    // =====================================================
    @Override
    public PartResponseModel getPartById(String partId) {

        validatePartId(partId);

        Part foundPart = partRepository.findPartByPartIdentifier_PartId(partId);

        if (foundPart == null) {
            throw new ResourceNotFoundException("Part " + partId + " not found.");
        }

        return partResponseMapper.toResponseModel(foundPart);
    }

    // =====================================================
    // CREATE PART
    // =====================================================
    @Override
    public PartResponseModel createPart(PartRequestModel requestModel) {

        // Enforce unique name (optional but recommended)
        Part existingByName = partRepository.findPartByName(requestModel.getName());
        if (existingByName != null) {
            throw new ResourceAlreadyExistsException(
                    "Part with name '" + requestModel.getName() + "' already exists."
            );
        }

        PartIdentifier identifier = new PartIdentifier(SkuGenerator.generateSku());
        Part part = partRequestMapper.toEntity(requestModel, identifier);

        // new parts are always available
        part.setAvailable(true);

        Part saved = partRepository.save(part);
        return partResponseMapper.toResponseModel(saved);
    }

    // =====================================================
    // UPDATE PART
    // =====================================================
    @Override
    public PartResponseModel updatePart(String partId, PartRequestModel requestModel) {

        validatePartId(partId);

        Part existingPart = partRepository.findPartByPartIdentifier_PartId(partId);

        if (existingPart == null) {
            throw new ResourceNotFoundException("Part " + partId + " not found.");
        }

        // Unique name validation (same logic as Customer userId)
        Part nameOwner = partRepository.findPartByName(requestModel.getName());
        if (nameOwner != null &&
                !nameOwner.getPartIdentifier().getPartId().equals(partId)) {

            throw new ResourceAlreadyExistsException(
                    "Cannot update part: another part already exists with name '" +
                            requestModel.getName() + "'."
            );
        }

        // Update fields
        existingPart.setName(requestModel.getName());
        existingPart.setAvailable(requestModel.getAvailable());

        Part updated = partRepository.save(existingPart);
        return partResponseMapper.toResponseModel(updated);
    }

    // =====================================================
    // DELETE PART (SOFT DELETE)
    // =====================================================
    @Override
    public void deletePart(String partId) {

        validatePartId(partId);

        Part part = partRepository.findPartByPartIdentifier_PartId(partId);

        if (part == null) {
            throw new ResourceNotFoundException("Part " + partId + " not found.");
        }

        if (!part.getAvailable()) {
            throw new InvalidOperationException("Part " + partId + " is already unavailable.");
        }

        part.setAvailable(false);
        partRepository.save(part);
    }


    private void validatePartId(String partId) {
        if (partId == null || partId.trim().isEmpty()) {
            throw new InvalidIdentifierException("Part ID cannot be null or empty.");
        }

        // Must match "PC-123456"
        if (!partId.matches("^PC-\\d{6}$")) {
            throw new InvalidIdentifierException("Part ID '" + partId + "' is invalid. Expected format: PC-######");
        }
    }
}
