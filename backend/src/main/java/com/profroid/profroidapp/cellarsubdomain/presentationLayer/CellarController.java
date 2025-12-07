package com.profroid.profroidapp.cellarsubdomain.presentationLayer;

import com.profroid.profroidapp.cellarsubdomain.businessLayer.CellarService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/v1/cellars")
public class CellarController {

    private final CellarService cellarService;

    public CellarController(CellarService cellarService) {
        this.cellarService = cellarService;
    }

    @GetMapping
    public ResponseEntity<List<CellarResponseModel>> getAllCellars() {
        List<CellarResponseModel> responseModels = cellarService.getAllCellars();
        return ResponseEntity.ok(responseModels);
    }

    @GetMapping("/{cellarId}")
    public ResponseEntity<CellarResponseModel> getCellarById(@PathVariable String cellarId) {
        CellarResponseModel responseModel = cellarService.getCellarById(cellarId);
        return ResponseEntity.ok(responseModel);
    }

    @PostMapping
    public ResponseEntity<CellarResponseModel> createCellar(@Valid @RequestBody CellarRequestModel cellarRequestModel) {
        String ownerCustomerId = cellarRequestModel.getOwnerCustomerId().getCustomerId();
        CellarResponseModel responseModel = cellarService.createCellar(ownerCustomerId, cellarRequestModel);
        return ResponseEntity.status(HttpStatus.CREATED).body(responseModel);
    }

    @PutMapping("/{cellarId}")
    public ResponseEntity<CellarResponseModel> updateCellar(@PathVariable String cellarId, @Valid @RequestBody CellarRequestModel cellarRequestModel) {
        CellarResponseModel responseModel = cellarService.updateCellar(cellarId, cellarRequestModel);
        return ResponseEntity.ok(responseModel);
    }

}
