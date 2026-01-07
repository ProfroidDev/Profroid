import React, { useState } from "react";
import { createPart } from "../api/createPart";
import { createPartWithImage } from "../api/createPartWithImage";
import type { PartRequestModel } from "../models/PartRequestModel";
import "./PartAddModal.css";
import { X } from "lucide-react";

interface PartAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPartAdded: () => void;
  onError: (message: string) => void;
}

export default function PartAddModal({
  isOpen,
  onClose,
  onPartAdded,
  onError,
}: PartAddModalProps): React.ReactElement | null {
  const [name, setName] = useState<string>("");
  const [available, setAvailable] = useState<boolean>(true);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const MAX_FILE_SIZE_MB = 10;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  if (!isOpen) {
    return null;
  }

  const validateFile = (selectedFile: File): boolean => {
    if (!selectedFile.type.startsWith("image/")) {
      onError("Only image files are allowed.");
      return false;
    }
    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (selectedFile.size / (1024 * 1024)).toFixed(2);
      onError(`File size (${sizeMB} MB) exceeds maximum allowed size (${MAX_FILE_SIZE_MB} MB).`);
      return false;
    }
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] ?? null;
    if (selectedFile && !validateFile(selectedFile)) {
      e.target.value = ""; // Reset input
      return;
    }
    setFile(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      onError("Part name is required");
      return;
    }

    setSubmitting(true);
    try {
      const partData: PartRequestModel = {
        name: name.trim(),
        available,
      };

      if (file) {
        await createPartWithImage(partData, file);
      } else {
        await createPart(partData);
      }
      
      // Reset form
      setName("");
      setAvailable(true);
      setFile(null);
      
      onPartAdded();
      onClose();
    } catch (error) {
      console.error("Error creating part:", error);
      onError("Failed to create part. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setName("");
      setAvailable(true);
      setFile(null);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add New Part</h2>
          <button className="modal-close" onClick={handleClose} disabled={submitting} aria-label="Close modal">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label" htmlFor="part-name">
                Part Name <span className="required">*</span>
              </label>
              <input
                id="part-name"
                type="text"
                className="form-input"
                placeholder="Enter part name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={submitting}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label checkbox-label">
                <input
                  type="checkbox"
                  className="form-checkbox"
                  checked={available}
                  onChange={(e) => setAvailable(e.target.checked)}
                  disabled={submitting}
                />
                <span>Available</span>
              </label>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="part-image">
                Image (optional)
              </label>
              <input
                id="part-image"
                type="file"
                accept="image/*"
                className="form-input"
                disabled={submitting}
                onChange={handleFileChange}
              />
              <p className="helper-text">Maximum file size: {MAX_FILE_SIZE_MB} MB. Only image files allowed.</p>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-cancel"
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={submitting}
            >
              {submitting ? "Adding..." : "Add Part"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
