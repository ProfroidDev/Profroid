package com.profroid.profroidapp.partsubdomain.businessLayer;

import com.profroid.profroidapp.partsubdomain.dataAccessLayer.Part;
import com.profroid.profroidapp.partsubdomain.dataAccessLayer.PartIdentifier;
import com.profroid.profroidapp.partsubdomain.dataAccessLayer.PartRepository;
import com.profroid.profroidapp.partsubdomain.mapperLayer.PartRequestMapper;
import com.profroid.profroidapp.partsubdomain.mapperLayer.PartResponseMapper;
import com.profroid.profroidapp.partsubdomain.presentationLayer.PartRequestModel;
import com.profroid.profroidapp.partsubdomain.presentationLayer.PartResponseModel;
import com.profroid.profroidapp.utils.generators.SkuGenerator.SkuGenerator;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PartServiceImpl implements PartService {

    private final PartRepository partRepository;
    private final PartResponseMapper partResponseMapper;
    private final PartRequestMapper partRequestMapper;

    public PartServiceImpl(PartRepository partRepository, PartResponseMapper partResponseMapper, PartRequestMapper partRequestMapper) {
        this.partRepository = partRepository;
        this.partResponseMapper = partResponseMapper;
        this.partRequestMapper = partRequestMapper;
    }


    @Override
    public List<PartResponseModel> getAllParts() {
        List<Part> parts = partRepository.findAll();
        return partResponseMapper.toResponseModelList(parts);
    }

    @Override
    public PartResponseModel getPartById(String partId) {
        Part part = partRepository.findPartByPartIdentifier_PartId(partId);
        return partResponseMapper.toResponseModel(part);
    }

    @Override
    public PartResponseModel createPart(PartRequestModel partRequestModel) {
        PartIdentifier partIdentifier = new PartIdentifier(SkuGenerator.generateSku());
        Part part = partRequestMapper.toEntity(partRequestModel, partIdentifier);
        Part savedPart = partRepository.save(part);
        return partResponseMapper.toResponseModel(savedPart);
    }

    @Override
    public PartResponseModel updatePart(String partId, PartRequestModel partRequestModel) {
        Part existingPart = partRepository.findPartByPartIdentifier_PartId(partId);

        if (existingPart == null) {
            throw new EntityNotFoundException("Part not found: " + partId);
        }

        existingPart.setName(partRequestModel.getName());
        existingPart.setAvailable(partRequestModel.getAvailable());

        Part updatedPart = partRepository.save(existingPart);

        return partResponseMapper.toResponseModel(updatedPart);
    }

    @Override
    public void deletePart(String partId) {
        Part existingPart = partRepository.findPartByPartIdentifier_PartId(partId);

        if (existingPart == null) {
            throw new EntityNotFoundException("Part not found: " + partId);
        }
        existingPart.setAvailable(false);
    }
}
