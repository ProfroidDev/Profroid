package com.profroid.profroidapp.cellarsubdomain.presentationLayer;

import com.profroid.profroidapp.cellarsubdomain.businessLayer.CellarService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1/cellars")
public class CellarController {

    private final CellarService cellarService;

    public CellarController(CellarService cellarService) {
        this.cellarService = cellarService;
    }

    /**
     * Helper to check if user has a specific role
     */
    private boolean hasRole(Authentication authentication, String role) {
        if (authentication == null) return false;
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(auth -> auth.equals("ROLE_" + role));
    }

    @GetMapping
    public ResponseEntity<List<CellarResponseModel>> getAllCellars(
            @RequestParam(value = "ownerCustomerId", required = false) String ownerCustomerId,
            Authentication authentication) {

        // If ownerCustomerId specified, filter by that customer
        if (ownerCustomerId != null && !ownerCustomerId.isBlank()) {
            List<CellarResponseModel> filtered = cellarService.getAllCellars(ownerCustomerId);
            return ResponseEntity.ok(filtered);
        }

        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.ok(List.of());
        }

        // For TECHNICIAN or ADMIN, return all cellars (they need to see all for scheduling)
        if (hasRole(authentication, "TECHNICIAN") || hasRole(authentication, "ADMIN")) {
            List<CellarResponseModel> allCellars = cellarService.getAllCellars();
            return ResponseEntity.ok(allCellars);
        }

        // For CUSTOMER, get only their cellars based on userId
        List<CellarResponseModel> responseModels = cellarService.getAllCellarsForUser(authentication.getName());
        return ResponseEntity.ok(responseModels);
    }

    @GetMapping("/{cellarId}")
    public ResponseEntity<CellarResponseModel> getCellarById(@PathVariable String cellarId,
                                                             @RequestParam(value = "ownerCustomerId", required = false) String ownerCustomerId) {
        if (ownerCustomerId != null && !ownerCustomerId.isBlank()) {
            CellarResponseModel responseModel = cellarService.getCellarById(ownerCustomerId, cellarId);
            return ResponseEntity.ok(responseModel);
        }
        CellarResponseModel responseModel = cellarService.getCellarById(cellarId);
        return ResponseEntity.ok(responseModel);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<CellarResponseModel> createCellar(@Valid @RequestBody CellarRequestModel cellarRequestModel) {
        String ownerCustomerId = cellarRequestModel.getOwnerCustomerId().getCustomerId();
        CellarResponseModel responseModel = cellarService.createCellar(ownerCustomerId, cellarRequestModel);
        return ResponseEntity.status(HttpStatus.CREATED).body(responseModel);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{cellarId}")
    public ResponseEntity<CellarResponseModel> updateCellar(@PathVariable String cellarId, @Valid @RequestBody CellarRequestModel cellarRequestModel) {
        String ownerCustomerId = cellarRequestModel.getOwnerCustomerId().getCustomerId();
        CellarResponseModel responseModel = cellarService.updateCellar(ownerCustomerId, cellarId, cellarRequestModel);
        return ResponseEntity.ok(responseModel);
    }
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{cellarId}/deactivate")
    public ResponseEntity<CellarResponseModel> deactivateCellar(@PathVariable String cellarId) {
        CellarResponseModel deactivated = cellarService.deactivateCellar(cellarId);
        return ResponseEntity.status(HttpStatus.OK).body(deactivated);
    }
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{cellarId}/reactivate")
    public ResponseEntity<CellarResponseModel> reactivateCellar(@PathVariable String cellarId) {
        CellarResponseModel reactivated = cellarService.reactivateCellar(cellarId);
        return ResponseEntity.status(HttpStatus.OK).body(reactivated);
    }
}
