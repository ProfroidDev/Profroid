package com.profroid.profroidapp.cellarsubdomain.presentationLayer;

import com.profroid.profroidapp.cellarsubdomain.businessLayer.CellarService;
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


}
