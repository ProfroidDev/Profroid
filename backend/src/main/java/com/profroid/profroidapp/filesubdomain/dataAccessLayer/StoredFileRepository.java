package com.profroid.profroidapp.filesubdomain.dataAccessLayer;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StoredFileRepository extends JpaRepository<StoredFile, UUID> {
	Optional<StoredFile> findByIdAndDeletedAtIsNull(UUID id);
	List<StoredFile> findAllByOwnerTypeAndOwnerIdAndDeletedAtIsNull(String ownerType, String ownerId);
	List<StoredFile> findAllByOwnerTypeAndOwnerIdAndCategoryAndDeletedAtIsNull(String ownerType, String ownerId, String category);
}
