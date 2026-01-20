package com.profroid.profroidapp.jobssubdomain.presentationLayer;

import com.profroid.profroidapp.jobssubdomain.businessLayer.JobService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/v1/jobs")
public class JobController {

    private final JobService jobService;

    public JobController(JobService jobService) {
        this.jobService = jobService;
    }

    @GetMapping
    public ResponseEntity<List<JobResponseModel>> getAllJobs(){
        return ResponseEntity.ok(jobService.getAllJobs());
    }

    @GetMapping("/{jobId}")
    public ResponseEntity<JobResponseModel> getJobById(@PathVariable String jobId){
        return ResponseEntity.ok(jobService.getJobById(jobId));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<JobResponseModel> createJob(@Valid @RequestBody JobRequestModel requestModel){
        return ResponseEntity.status(HttpStatus.CREATED).body(jobService.createJob(requestModel));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{jobId}")
    public ResponseEntity<JobResponseModel> updateJob(@PathVariable String jobId, @Valid @RequestBody JobRequestModel requestModel){
        return ResponseEntity.ok(jobService.updateJob(jobId, requestModel));
    }
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{jobId}/deactivate")
    public ResponseEntity<JobResponseModel> deactivateJob(@PathVariable String jobId){
        JobResponseModel deactivated = jobService.deactivateJob(jobId);
        return ResponseEntity.status(HttpStatus.OK).body(deactivated);
    }
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{jobId}/reactivate")
    public ResponseEntity<JobResponseModel> reactivateJob(@PathVariable String jobId){
        JobResponseModel reactivated = jobService.reactivateJob(jobId);
        return ResponseEntity.status(HttpStatus.OK).body(reactivated);
    }
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping(value = "/{jobId}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<JobResponseModel> uploadJobImage(
            @PathVariable String jobId,
            @RequestPart("file") MultipartFile file) {
        JobResponseModel updated = jobService.uploadJobImage(jobId, file);
        return ResponseEntity.ok(updated);
    }
}
