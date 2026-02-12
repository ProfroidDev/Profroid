import React from 'react';
import { useTranslation } from 'react-i18next';
import type { PartResponseModel } from '../models/PartResponseModel';
import './PartDetailModal.css';

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
  const { t } = useTranslation();

  if (!isOpen || !part) {
    return null;
  }

  const imageUrl = part.imageFileId
    ? `${import.meta.env.VITE_BACKEND_URL}/files/${part.imageFileId}/download`
    : `https://via.placeholder.com/300x300?text=${encodeURIComponent(part.name)}`;

  return (
    <div className="part-detail-modal-overlay" onClick={onClose}>
      <div className="part-detail-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="part-detail-modal-header">
          <h2 className="part-detail-modal-title">{part.name}</h2>
          <button className="part-detail-modal-close" onClick={onClose}>
            &#10005;
          </button>
        </div>

        <div className="part-detail-modal-body">
          <div className="part-detail-modal-image-container">
            <img src={imageUrl} alt={part.name} className="part-detail-modal-image" />
          </div>

          <div className="part-detail-modal-details">
            <div className="part-detail-detail-row">
              <span className="part-detail-detail-label">Part ID:</span>
              <span className="part-detail-detail-value">{part.partId}</span>
            </div>

            <div className="part-detail-detail-row">
              <span className="part-detail-detail-label">{t('pages.parts.form.partName')}:</span>
              <span className="part-detail-detail-value">{part.name}</span>
            </div>

            <div className="part-detail-detail-row">
              <span className="part-detail-detail-label">{t('pages.parts.form.available')}:</span>
              <span
                className={`part-detail-availability-badge ${part.available ? 'available' : 'unavailable'}`}
              >
                {part.available
                  ? t('pages.parts.form.available')
                  : t('pages.parts.form.unavailable')}
              </span>
            </div>
          </div>
        </div>

        <div className="part-detail-modal-footer">
          <button className="part-detail-btn-close-modal" onClick={onClose}>
            {t('pages.parts.form.closeButton')}
          </button>
        </div>
      </div>
    </div>
  );
}
