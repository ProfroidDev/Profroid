import React from "react";
import type { PartResponseModel } from "../models/PartResponseModel";
import "./PartDetailModal.css";

interface PartDetailModalProps {
  part: PartResponseModel | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PartDetailModal({
  part,
  isOpen,
  onClose,
}: PartDetailModalProps): React.ReactElement | null {
  if (!isOpen || !part) {
    return null;
  }

  const imageUrl = part.imageFileId
    ? `${import.meta.env.VITE_BACKEND_URL}/files/${part.imageFileId}/download`
    : `https://via.placeholder.com/300x300?text=${encodeURIComponent(part.name)}`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{part.name}</h2>
          <button className="modal-close" onClick={onClose}>
            &#10005;
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-image-container">
            <img
              src={imageUrl}
              alt={part.name}
              className="modal-image"
            />
          </div>

          <div className="modal-details">
            <div className="detail-row">
              <span className="detail-label">Part ID:</span>
              <span className="detail-value">{part.partId}</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Name:</span>
              <span className="detail-value">{part.name}</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Availability:</span>
              <span className={`availability-badge ${part.available ? 'available' : 'unavailable'}`}>
                {part.available ? 'Available' : 'Unavailable'}
              </span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-close-modal" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
