import React, { useState } from "react";
import { updatePart } from "../api/updatePart";
import type { PartRequestModel } from "../models/PartRequestModel";
import type { PartResponseModel } from "../models/PartResponseModel";
import "./PartEditModal.css";
import { X } from "lucide-react";

interface PartEditModalProps {
  part: PartResponseModel | null;
  isOpen: boolean;
  onClose: () => void;
  onPartUpdated: () => void;
  onError: (message: string) => void;
}

export default function PartEditModal({
  part,
  isOpen,
  onClose,
  onPartUpdated,
  onError,
}: PartEditModalProps): React.ReactElement | null {
  const [name, setName] = useState<string>(part?.name || "");
  const [available, setAvailable] = useState<boolean>(part?.available ?? true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  React.useEffect(() => {
    if (part) {
      setName(part.name);
      setAvailable(part.available);
    }
  }, [part]);

  if (!isOpen || !part) {
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

      await updatePart(part.partId, partData);

      onPartUpdated();
      onClose();
    } catch (error) {
      console.error("Error updating part:", error);
      onError("Failed to update part. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Edit Part</h2>
          <button
            className="modal-close"
            onClick={handleClose}
            disabled={submitting}
            aria-label="Close modal"
          >
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
            <button type="submit" className="btn-submit" disabled={submitting}>
              {submitting ? "Updating..." : "Update Part"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
