package com.profroid.profroidapp.partsubdomain.dataAccessLayer;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "parts")
@Data
@NoArgsConstructor
public class Part {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Embedded
    private PartIdentifier partIdentifier;

    private String name;
    private Boolean available;

    @Column(name = "image_file_id")
    private UUID imageFileId;
}
