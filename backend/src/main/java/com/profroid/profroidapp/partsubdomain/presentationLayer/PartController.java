package com.profroid.profroidapp.partsubdomain.presentationLayer;

import com.profroid.profroidapp.cellarsubdomain.businessLayer.CellarService;
import com.profroid.profroidapp.partsubdomain.businessLayer.PartService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("api/v1/parts")
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
}
