package com.profroid.profroidapp.partsubdomain.presentationLayer;

import com.profroid.profroidapp.partsubdomain.businessLayer.PartService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;

import java.util.List;

@RestController
@RequestMapping("/v1/parts")
public class PartController {

    private final PartService partService;

    public PartController(PartService partService) {
        this.partService = partService;
    }

    @GetMapping
    public ResponseEntity<List<PartResponseModel>> getAllParts() {
        List<PartResponseModel> responseModels = partService.getAllParts();
        return ResponseEntity.ok(responseModels);
    }

    @GetMapping("/{partId}")
    public ResponseEntity<PartResponseModel> getPartById(@PathVariable String partId) {
        PartResponseModel responseModel = partService.getPartById(partId);
        return ResponseEntity.ok(responseModel);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<PartResponseModel> createPart(@Valid @RequestBody PartRequestModel requestModel) {
        PartResponseModel responseModel = partService.createPart(requestModel);
        return ResponseEntity.status(HttpStatus.CREATED).body(responseModel);
    }
reAuthorize("hasRole('ADMIN')")
    @P
    @PostMapping(value = "/with-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PartResponseModel> createPartWithImage(
            @RequestPart("part") @Valid PartRequestModel requestModel,
            @RequestPart("file") MultipartFile file) {
        PartResponseModel responseModel = partService.createPartWithImage(requestModel, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(responseModel);
    }
reAuthorize("hasRole('ADMIN')")
    @P
    @PutMapping("/{partId}")
    public ResponseEntity<PartResponseModel> updatePart(
            @PathVariable String partId,
            @Valid @RequestBody PartRequestModel requestModel) {
        PartResponseModel responseModel = partService.updatePart(partId, requestModel);
        return ResponseEntity.ok(responseModel);
    }
reAuthorize("hasRole('ADMIN')")
    @P
    @PutMapping(value = "/{partId}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PartResponseModel> uploadPartImage(
            @PathVariable String partId,
            @RequestPart("file") MultipartFile file) {
        PartResponseModel responseModel = partService.uploadPartImage(partId, file);
        return ResponseEntity.ok(responseModel);
    }
PreAuthorize("hasRole('ADMIN')")
    @
    @DeleteMapping("/{partId}")
    public ResponseEntity<Void> deletePart(@PathVariable String partId) {
        partService.deletePart(partId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping(value = "/export/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> exportInventoryToPdf() {
        try {
            byte[] pdfContent = partService.exportInventoryToPdf();
            
            String filename = "inventory_report_" + java.time.LocalDate.now() + ".pdf";
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .contentLength(pdfContent.length)
                    .header("Content-Disposition", "attachment; filename=\"" + filename + "\"")
                    .header("Cache-Control", "no-cache, no-store, must-revalidate")
                    .header("Pragma", "no-cache")
                    .header("Expires", "0")
                    .body(pdfContent);
        } catch (Exception e) {
            throw new RuntimeException("Error exporting PDF: " + e.getMessage(), e);
        }
    }
}
