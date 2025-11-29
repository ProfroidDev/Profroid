package com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Embeddable
@Getter
@Setter
@AllArgsConstructor
public class EmployeeIdentifier {

    @Column(unique = true, nullable = false)
    private String employeeId;

    public EmployeeIdentifier(){
        this.employeeId = UUID.randomUUID().toString();
    }


}
