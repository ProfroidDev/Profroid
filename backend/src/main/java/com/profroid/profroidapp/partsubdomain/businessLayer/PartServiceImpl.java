package com.profroid.profroidapp.partsubdomain.businessLayer;

import com.profroid.profroidapp.partsubdomain.dataAccessLayer.Part;
import com.profroid.profroidapp.partsubdomain.dataAccessLayer.PartIdentifier;
import com.profroid.profroidapp.partsubdomain.dataAccessLayer.PartRepository;
import com.profroid.profroidapp.partsubdomain.mappingLayer.PartRequestMapper;
import com.profroid.profroidapp.partsubdomain.mappingLayer.PartResponseMapper;
import com.profroid.profroidapp.partsubdomain.presentationLayer.PartRequestModel;
import com.profroid.profroidapp.partsubdomain.presentationLayer.PartResponseModel;
import com.profroid.profroidapp.filesubdomain.businessLayer.FileService;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.FileCategory;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.FileOwnerType;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.StoredFile;
import com.profroid.profroidapp.utils.exceptions.InvalidIdentifierException;
import com.profroid.profroidapp.utils.exceptions.ResourceAlreadyExistsException;
import com.profroid.profroidapp.utils.exceptions.ResourceNotFoundException;
import com.profroid.profroidapp.utils.exceptions.InvalidOperationException;
import com.profroid.profroidapp.utils.generators.SkuGenerator.SkuGenerator;
import com.profroid.profroidapp.utils.generators.InventoryPdfGenerator;
import com.profroid.profroidapp.utils.generators.InventoryPdfGenerator.InventoryPdfResult;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Service
public class PartServiceImpl implements PartService {

    private static final Logger log = LoggerFactory.getLogger(PartServiceImpl.class);

    private final PartRepository partRepository;
    private final PartResponseMapper partResponseMapper;
    private final PartRequestMapper partRequestMapper;
    private final FileService fileService;
    private final InventoryPdfGenerator inventoryPdfGenerator;

    public PartServiceImpl(PartRepository partRepository,
                           PartResponseMapper partResponseMapper,
                           PartRequestMapper partRequestMapper,
                           FileService fileService,
                           InventoryPdfGenerator inventoryPdfGenerator) {
        this.partRepository = partRepository;
        this.partResponseMapper = partResponseMapper;
        this.partRequestMapper = partRequestMapper;
        this.fileService = fileService;
        this.inventoryPdfGenerator = inventoryPdfGenerator;
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

        // new parts are always available by default
        if (part.getAvailable() == null) {
            part.setAvailable(true);
        }
        
        // Set default thresholds if not provided
        if (part.getLowStockThreshold() == null) {
            part.setLowStockThreshold(5);
        }
        if (part.getOutOfStockThreshold() == null) {
            part.setOutOfStockThreshold(0);
        }
        if (part.getHighStockThreshold() == null) {
            part.setHighStockThreshold(50);
        }

        Part saved = partRepository.save(part);
        return partResponseMapper.toResponseModel(saved);
    }

    @Override
    public PartResponseModel createPartWithImage(PartRequestModel requestModel, MultipartFile file) {
        PartResponseModel created = createPart(requestModel);
        if (file == null || file.isEmpty()) {
            return created;
        }
        return uploadPartImage(created.getPartId(), file);
    }

    // =====================================================
    // UPDATE PART
    // =====================================================
    @Override
    public PartResponseModel updatePart(String partId, PartRequestModel requestModel) {


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

        // Update all fields
        existingPart.setName(requestModel.getName());
        existingPart.setCategory(requestModel.getCategory());
        existingPart.setQuantity(requestModel.getQuantity());
        existingPart.setPrice(requestModel.getPrice());
        existingPart.setSupplier(requestModel.getSupplier());
        existingPart.setAvailable(requestModel.getAvailable());
        
        if (requestModel.getLowStockThreshold() != null) {
            existingPart.setLowStockThreshold(requestModel.getLowStockThreshold());
        }
        if (requestModel.getOutOfStockThreshold() != null) {
            existingPart.setOutOfStockThreshold(requestModel.getOutOfStockThreshold());
        }
        if (requestModel.getHighStockThreshold() != null) {
            existingPart.setHighStockThreshold(requestModel.getHighStockThreshold());
        }

        Part updated = partRepository.save(existingPart);
        return partResponseMapper.toResponseModel(updated);
    }

    @Override
    public PartResponseModel uploadPartImage(String partId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidOperationException("File is required for upload.");
        }

        Part part = partRepository.findPartByPartIdentifier_PartId(partId);
        if (part == null) {
            throw new ResourceNotFoundException("Part " + partId + " not found.");
        }

        // Store previous image ID for cleanup after successful upload
        UUID previousImageId = part.getImageFileId();

        // Upload new image first to ensure it succeeds before making any changes
        var stored = fileService.upload(file, FileOwnerType.PART, partId, FileCategory.IMAGE);
        
        // Update database with new image reference
        part.setImageFileId(stored.getId());
        Part saved = partRepository.save(part);

        // Clean up old image in a separate transaction to avoid persistence context conflicts
        if (previousImageId != null) {
            try {
                fileService.delete(previousImageId);
            } catch (Exception e) {
                // Log but don't fail - orphaned files can be cleaned up later
                // In production, consider a scheduled cleanup job for orphaned files
            }
        }

        return partResponseMapper.toResponseModel(saved);
    }

    // =====================================================
    // DELETE PART (SOFT DELETE)
    // =====================================================
    @Override
    public void deletePart(String partId) {


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

    // =====================================================
    // EXPORT INVENTORY TO PDF
    // =====================================================
    @Override
    public byte[] exportInventoryToPdf() {
        try {
            log.info("Starting PDF export...");
            
            // Get all parts
            List<PartResponseModel> parts = getAllParts();
            log.info("Retrieved {} parts for PDF export", parts.size());
            
            // Generate PDF and store in MinIO
            InventoryPdfResult pdfResult = inventoryPdfGenerator.generateAndStoreInventoryPdf(parts, fileService);
            log.info("Generated PDF with size: {} bytes", pdfResult.pdfContent().length);
            
            StoredFile storedFile = pdfResult.storedFile();
            log.info("PDF stored successfully with ID: {}", storedFile.getId());
            log.info("PDF location: {}/{}", storedFile.getBucket(), storedFile.getObjectKey());
            
            // Return the in-memory PDF directly - it's already validated from the generator
            log.info("Returning in-memory PDF with size: {} bytes", pdfResult.pdfContent().length);
            return pdfResult.pdfContent();
            
        } catch (Exception e) {
            log.error("Failed to export inventory to PDF", e);
            throw new RuntimeException("Error exporting inventory PDF: " + e.getMessage(), e);
        }
    }


}
