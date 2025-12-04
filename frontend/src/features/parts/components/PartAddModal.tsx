import React, { useState } from "react";
import { createPart } from "../api/createPart";
import type { PartRequestModel } from "../models/PartRequestModel";
import "./PartAddModal.css";

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
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!isOpen) {
    return null;
  }

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
      
      await createPart(partData);
      
      // Reset form
      setName("");
      setAvailable(true);
      
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
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add New Part</h2>
          <button className="modal-close" onClick={handleClose} disabled={submitting}>
            ✕
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
