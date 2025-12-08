package com.profroid.profroidapp.partsubdomain.presentationLayer;

import com.profroid.profroidapp.partsubdomain.businessLayer.PartService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/parts")
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

    @PostMapping
    public ResponseEntity<PartResponseModel> createPart(@Valid @RequestBody PartRequestModel requestModel) {
        PartResponseModel responseModel = partService.createPart(requestModel);
        return ResponseEntity.status(HttpStatus.CREATED).body(responseModel);
    }

    @PutMapping("/{partId}")
    public ResponseEntity<PartResponseModel> updatePart(
            @PathVariable String partId,
            @Valid @RequestBody PartRequestModel requestModel) {
        PartResponseModel responseModel = partService.updatePart(partId, requestModel);
        return ResponseEntity.ok(responseModel);
    }

    @DeleteMapping("/{partId}")
    public ResponseEntity<Void> deletePart(@PathVariable String partId) {
        partService.deletePart(partId);
        return ResponseEntity.noContent().build();
    }
}
