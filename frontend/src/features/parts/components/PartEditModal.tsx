import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { updatePart } from '../api/updatePart';
import { uploadPartImage } from '../api/uploadPartImage';
import { deleteFile } from '../../files/api/deleteFile';
import { sanitizeInput } from '../../../utils/sanitizer';
import type { PartRequestModel } from '../models/PartRequestModel';
import type { PartResponseModel } from '../models/PartResponseModel';
import { CATEGORY_OPTIONS, normalizeCategory } from '../utils/partLocalization';
import './PartEditModal.css';
import { X, Trash2 } from 'lucide-react';
import ConfirmationModal from '../../../components/ConfirmationModal';

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
  const { t } = useTranslation();
  const MAX_TEXT_LENGTH = 100;
  const [name, setName] = useState<string>(part?.name || '');
  const [category, setCategory] = useState<string>(normalizeCategory(part?.category || 'General'));
  const [quantity, setQuantity] = useState<number>(part?.quantity || 0);
  const [price, setPrice] = useState<number>(part?.price || 0);
  const [supplier, setSupplier] = useState<string>(part?.supplier || '');
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(part?.lowStockThreshold || 5);
  const [outOfStockThreshold, setOutOfStockThreshold] = useState<number>(
    part?.outOfStockThreshold || 0
  );
  const [highStockThreshold, setHighStockThreshold] = useState<number>(
    part?.highStockThreshold || 100
  );
  const [available, setAvailable] = useState<boolean>(part?.available ?? true);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [imageDeleteLoading, setImageDeleteLoading] = useState<boolean>(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false);
  const [currentImageFileId, setCurrentImageFileId] = useState<string | null | undefined>(
    part?.imageFileId
  );
  const [isOverlayMouseDown, setIsOverlayMouseDown] = useState<boolean>(false);

  const MAX_FILE_SIZE_MB = 10;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  const validateFile = (selectedFile: File): boolean => {
    if (!selectedFile.type.startsWith('image/')) {
      onError(t('pages.parts.form.onlyImageFilesAllowed'));
      return false;
    }
    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (selectedFile.size / (1024 * 1024)).toFixed(2);
      onError(`${t('pages.parts.form.fileSizeExceeds')}: ${sizeMB} MB / ${MAX_FILE_SIZE_MB} MB`);
      return false;
    }
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] ?? null;
    if (selectedFile && !validateFile(selectedFile)) {
      e.target.value = ''; // Reset input
      return;
    }
    setFile(selectedFile);
  };

  React.useEffect(() => {
    if (part) {
      setName(part.name);
      setCategory(normalizeCategory(part.category || 'General'));
      setQuantity(part.quantity || 0);
      setPrice(part.price || 0);
      setSupplier(part.supplier || '');
      setLowStockThreshold(part.lowStockThreshold || 5);
      setOutOfStockThreshold(part.outOfStockThreshold || 0);
      setHighStockThreshold(part.highStockThreshold || 100);
      setAvailable(part.available);
      setFile(null);
      setCurrentImageFileId(part.imageFileId);
    }
  }, [part]);

  if (!isOpen || !part) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      onError(t('pages.parts.form.partName') + ' ' + t('common.required'));
      return;
    }

    setSubmitting(true);
    try {
      const partData: PartRequestModel = {
        name: name.trim(),
        category,
        quantity,
        price,
        supplier: supplier.trim(),
        lowStockThreshold,
        outOfStockThreshold,
        highStockThreshold,
        available,
      };

      await updatePart(part.partId, partData);

      if (file) {
        await uploadPartImage(part.partId, file);
      }

      onPartUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating part:', error);
      onError(t('pages.parts.form.updateButton') + ' ' + t('common.failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteImage = () => {
    if (!part.imageFileId) {
      onError('No image to delete');
      return;
    }

    setShowDeleteConfirmation(true);
  };

  const confirmDeleteImage = async () => {
    if (!part.imageFileId) {
      return;
    }

    setImageDeleteLoading(true);
    try {
      await deleteFile(part.imageFileId);
      // Immediately remove from display
      setCurrentImageFileId(undefined);
      // Update the part by calling the callback to refresh the list
      onPartUpdated();
    } catch (error) {
      console.error('Error deleting image:', error);
      onError(t('common.failed'));
    } finally {
      setImageDeleteLoading(false);
      setShowDeleteConfirmation(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      onClose();
    }
  };

  const handleOverlayMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsOverlayMouseDown(true);
    }
  };

  const handleOverlayMouseUp = (e: React.MouseEvent) => {
    if (isOverlayMouseDown && e.target === e.currentTarget) {
      handleClose();
    }
    setIsOverlayMouseDown(false);
  };

  return (
    <div
      className="part-edit-modal-overlay"
      onMouseDown={handleOverlayMouseDown}
      onMouseUp={handleOverlayMouseUp}
    >
      <div className="part-edit-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="part-edit-modal-header">
          <h2 className="part-edit-modal-title">{t('pages.parts.editPart')}</h2>
          <button
            className="part-edit-modal-close"
            onClick={handleClose}
            disabled={submitting}
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="part-edit-modal-body">
            <div className="part-edit-form-group">
              <label className="part-edit-form-label" htmlFor="part-name">
                {t('pages.parts.form.partName')} <span className="part-edit-required">*</span>
                <span style={{ fontSize: '0.85rem', color: '#666', marginLeft: '8px' }}>
                  {name.length}/{MAX_TEXT_LENGTH}
                </span>
              </label>
              <input
                id="part-name"
                type="text"
                className="part-edit-form-input"
                placeholder={t('pages.parts.form.enterPartName')}
                value={name}
                onChange={(e) => setName(sanitizeInput(e.target.value).slice(0, MAX_TEXT_LENGTH))}
                maxLength={MAX_TEXT_LENGTH}
                disabled={submitting}
                required
              />
            </div>

            <div className="part-edit-form-group">
              <label className="part-edit-form-label" htmlFor="part-category">
                {t('pages.parts.form.category')} <span className="part-edit-required">*</span>
              </label>
              <select
                id="part-category"
                className="part-edit-form-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={submitting}
                required
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </option>
                ))}
              </select>
            </div>

            <div className="part-edit-form-group">
              <label className="part-edit-form-label" htmlFor="part-quantity">
                {t('pages.parts.form.quantity')} <span className="part-edit-required">*</span>
              </label>
              <input
                id="part-quantity"
                type="text"
                min="0"
                className="part-edit-form-input"
                placeholder={t('pages.parts.form.quantity')}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                disabled={submitting}
                required
              />
            </div>

            <div className="part-edit-form-group">
              <label className="part-edit-form-label" htmlFor="part-price">
                {t('pages.parts.form.price')} <span className="part-edit-required">*</span>
              </label>
              <input
                id="part-price"
                type="text"
                min="0"
                className="part-edit-form-input"
                placeholder={t('pages.parts.form.price')}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                disabled={submitting}
                required
              />
            </div>

            <div className="part-edit-form-group">
              <label className="part-edit-form-label" htmlFor="part-supplier">
                {t('pages.parts.form.supplier')} <span className="part-edit-required">*</span>
                <span style={{ fontSize: '0.85rem', color: '#666', marginLeft: '8px' }}>
                  {supplier.length}/{MAX_TEXT_LENGTH}
                </span>
              </label>
              <input
                id="part-supplier"
                type="text"
                className="part-edit-form-input"
                placeholder={t('pages.parts.form.enterSupplierName')}
                value={supplier}
                onChange={(e) =>
                  setSupplier(sanitizeInput(e.target.value).slice(0, MAX_TEXT_LENGTH))
                }
                maxLength={MAX_TEXT_LENGTH}
                disabled={submitting}
                required
              />
            </div>

            <div className="part-edit-form-group">
              <label className="part-edit-form-label" htmlFor="part-low-threshold">
                {t('pages.parts.form.lowStockThreshold')}
              </label>
              <input
                id="part-low-threshold"
                type="text"
                min="0"
                className="part-edit-form-input"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                disabled={submitting}
              />
            </div>

            <div className="part-edit-form-group">
              <label className="part-edit-form-label" htmlFor="part-out-threshold">
                {t('pages.parts.form.outOfStockThreshold')}
              </label>
              <input
                id="part-out-threshold"
                type="text"
                min="0"
                className="part-edit-form-input"
                value={outOfStockThreshold}
                onChange={(e) => setOutOfStockThreshold(Number(e.target.value))}
                disabled={submitting}
              />
            </div>

            <div className="part-edit-form-group">
              <label className="part-edit-form-label" htmlFor="part-high-threshold">
                {t('pages.parts.form.highStockThreshold')}
              </label>
              <input
                id="part-high-threshold"
                type="text"
                min="0"
                className="part-edit-form-input"
                value={highStockThreshold}
                onChange={(e) => setHighStockThreshold(Number(e.target.value))}
                disabled={submitting}
              />
            </div>

            <div className="part-edit-form-group">
              <label className="part-edit-form-label part-edit-checkbox-label">
                <input
                  type="checkbox"
                  className="part-edit-form-checkbox"
                  checked={available}
                  onChange={(e) => setAvailable(e.target.checked)}
                  disabled={submitting}
                />
                <span>{t('pages.parts.form.available')}</span>
              </label>
            </div>

            <div className="part-edit-form-group">
              <label className="part-edit-form-label" htmlFor="part-image">
                {t('pages.parts.form.image')}
              </label>
              <input
                id="part-image"
                type="file"
                accept="image/*"
                className="part-edit-form-input"
                disabled={submitting || imageDeleteLoading}
                onChange={handleFileChange}
              />
              <p className="part-edit-helper-text">
                {t('pages.parts.form.maximumFileSize')}: {MAX_FILE_SIZE_MB} MB.{' '}
                {t('pages.parts.form.onlyImageFilesAllowed')}
              </p>
              {currentImageFileId && (
                <div>
                  <div className="part-edit-image-preview-container">
                    <img
                      src={`${import.meta.env.VITE_BACKEND_URL}/files/${currentImageFileId}/download`}
                      alt="Current part image"
                      className="part-edit-image-preview"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                  <p className="part-edit-helper-text">
                    {t('pages.parts.form.uploadNewImageToReplace')}
                  </p>
                  <button
                    type="button"
                    className="part-edit-btn-delete-image"
                    onClick={handleDeleteImage}
                    disabled={submitting || imageDeleteLoading}
                    aria-label="Delete current image"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t('pages.parts.form.deleteCurrentImage')}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="part-edit-modal-footer">
            <button
              type="button"
              className="part-edit-btn-cancel"
              onClick={handleClose}
              disabled={submitting}
            >
              {t('pages.parts.form.cancelButton')}
            </button>
            <button type="submit" className="part-edit-btn-submit" disabled={submitting}>
              {submitting ? t('common.loading') : t('pages.parts.form.updateButton')}
            </button>
          </div>
        </form>
      </div>

      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        title={t('pages.parts.form.deleteImage')}
        message={t('pages.parts.form.deleteImageConfirmMessage')}
        confirmText={t('pages.parts.form.deleteButton')}
        cancelText={t('pages.parts.form.cancelButton')}
        isDanger={true}
        isLoading={imageDeleteLoading}
        onConfirm={confirmDeleteImage}
        onCancel={() => setShowDeleteConfirmation(false)}
      />
    </div>
  );
}
