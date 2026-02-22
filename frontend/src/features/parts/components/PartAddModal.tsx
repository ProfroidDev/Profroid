import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createPart } from '../api/createPart';
import { createPartWithImage } from '../api/createPartWithImage';
import { sanitizeInput } from '../../../utils/sanitizer';
import type { PartRequestModel } from '../models/PartRequestModel';
import { CATEGORY_OPTIONS } from '../utils/partLocalization';
import './PartAddModal.css';
import { X } from 'lucide-react';

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
  const { t } = useTranslation();
  const MAX_TEXT_LENGTH = 100;
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<string>('General');
  const [quantity, setQuantity] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);
  const [supplier, setSupplier] = useState<string>('');
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);
  const [outOfStockThreshold, setOutOfStockThreshold] = useState<number>(0);
  const [highStockThreshold, setHighStockThreshold] = useState<number>(100);
  const [available, setAvailable] = useState<boolean>(true);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [isOverlayMouseDown, setIsOverlayMouseDown] = useState<boolean>(false);

  const MAX_FILE_SIZE_MB = 10;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  if (!isOpen) {
    return null;
  }

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

      if (file) {
        await createPartWithImage(partData, file);
      } else {
        await createPart(partData);
      }

      // Reset form
      setName('');
      setCategory('General');
      setQuantity(0);
      setPrice(0);
      setSupplier('');
      setLowStockThreshold(5);
      setOutOfStockThreshold(0);
      setHighStockThreshold(100);
      setAvailable(true);
      setFile(null);

      onPartAdded();
      onClose();
    } catch (error) {
      console.error('Error creating part:', error);
      onError(t('pages.parts.form.addButton') + ' ' + t('common.failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setName('');
      setCategory('General');
      setQuantity(0);
      setPrice(0);
      setSupplier('');
      setLowStockThreshold(5);
      setOutOfStockThreshold(0);
      setHighStockThreshold(100);
      setAvailable(true);
      setFile(null);
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
      className="part-add-modal-overlay"
      onMouseDown={handleOverlayMouseDown}
      onMouseUp={handleOverlayMouseUp}
    >
      <div className="part-add-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="part-add-modal-header">
          <h2 className="part-add-modal-title">{t('pages.parts.addPart')}</h2>
          <button
            className="part-add-modal-close"
            onClick={handleClose}
            disabled={submitting}
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="part-add-modal-body">
            <div className="part-add-form-group">
              <label className="part-add-form-label" htmlFor="part-name">
                {t('pages.parts.form.partName')} <span className="part-add-required">*</span>
                <span style={{ fontSize: '0.85rem', color: '#666', marginLeft: '8px' }}>
                  {name.length}/{MAX_TEXT_LENGTH}
                </span>
              </label>
              <input
                id="part-name"
                type="text"
                className="part-add-form-input"
                placeholder={t('pages.parts.form.enterPartName')}
                value={name}
                onChange={(e) =>
                  setName(sanitizeInput(e.target.value).slice(0, MAX_TEXT_LENGTH))
                }
                maxLength={MAX_TEXT_LENGTH}
                disabled={submitting}
                required
              />
            </div>

            <div className="part-add-form-group">
              <label className="part-add-form-label" htmlFor="part-category">
                {t('pages.parts.form.category')} <span className="part-add-required">*</span>
              </label>
              <select
                id="part-category"
                className="part-add-form-input"
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

            <div className="part-add-form-group">
              <label className="part-add-form-label" htmlFor="part-quantity">
                {t('pages.parts.form.quantity')} <span className="part-add-required">*</span>
              </label>
              <input
                id="part-quantity"
                type="text"
                min="0"
                className="part-add-form-input"
                placeholder={t('pages.parts.form.quantity')}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                disabled={submitting}
                required
              />
            </div>

            <div className="part-add-form-group">
              <label className="part-add-form-label" htmlFor="part-price">
                {t('pages.parts.form.price')} <span className="part-add-required">*</span>
              </label>
              <input
                id="part-price"
                type="text"
                min="0"
                className="part-add-form-input"
                placeholder={t('pages.parts.form.price')}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                disabled={submitting}
                required
              />
            </div>

            <div className="part-add-form-group">
              <label className="part-add-form-label" htmlFor="part-supplier">
                {t('pages.parts.form.supplier')} <span className="part-add-required">*</span>
                <span style={{ fontSize: '0.85rem', color: '#666', marginLeft: '8px' }}>
                  {supplier.length}/{MAX_TEXT_LENGTH}
                </span>
              </label>
              <input
                id="part-supplier"
                type="text"
                className="part-add-form-input"
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

            <div className="part-add-form-group">
              <label className="part-add-form-label" htmlFor="part-low-threshold">
                {t('pages.parts.form.lowStockThreshold')}
              </label>
              <input
                id="part-low-threshold"
                type="text"
                min="0"
                className="part-add-form-input"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                disabled={submitting}
              />
            </div>

            <div className="part-add-form-group">
              <label className="part-add-form-label" htmlFor="part-out-threshold">
                {t('pages.parts.form.outOfStockThreshold')}
              </label>
              <input
                id="part-out-threshold"
                type="text"
                min="0"
                className="part-add-form-input"
                value={outOfStockThreshold}
                onChange={(e) => setOutOfStockThreshold(Number(e.target.value))}
                disabled={submitting}
              />
            </div>

            <div className="part-add-form-group">
              <label className="part-add-form-label" htmlFor="part-high-threshold">
                {t('pages.parts.form.highStockThreshold')}
              </label>
              <input
                id="part-high-threshold"
                type="text"
                min="0"
                className="part-add-form-input"
                value={highStockThreshold}
                onChange={(e) => setHighStockThreshold(Number(e.target.value))}
                disabled={submitting}
              />
            </div>

            <div className="part-add-form-group">
              <label className="part-add-form-label part-add-checkbox-label">
                <input
                  type="checkbox"
                  className="part-add-form-checkbox"
                  checked={available}
                  onChange={(e) => setAvailable(e.target.checked)}
                  disabled={submitting}
                />
                <span>{t('pages.parts.form.available')}</span>
              </label>
            </div>

            <div className="part-add-form-group">
              <label className="part-add-form-label" htmlFor="part-image">
                {t('pages.parts.form.image')}
              </label>
              <input
                id="part-image"
                type="file"
                accept="image/*"
                className="part-add-form-input"
                disabled={submitting}
                onChange={handleFileChange}
              />
              <p className="part-add-helper-text">
                {t('pages.parts.form.maximumFileSize')}: {MAX_FILE_SIZE_MB} MB.{' '}
                {t('pages.parts.form.onlyImageFilesAllowed')}
              </p>
            </div>
          </div>

          <div className="part-add-modal-footer">
            <button
              type="button"
              className="part-add-btn-cancel"
              onClick={handleClose}
              disabled={submitting}
            >
              {t('pages.parts.form.cancelButton')}
            </button>
            <button type="submit" className="part-add-btn-submit" disabled={submitting}>
              {submitting ? t('common.loading') : t('pages.parts.form.addButton')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
