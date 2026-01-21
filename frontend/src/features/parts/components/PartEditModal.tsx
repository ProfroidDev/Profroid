import React, { useState } from 'react';
import { updatePart } from '../api/updatePart';
import { uploadPartImage } from '../api/uploadPartImage';
import { deleteFile } from '../../files/api/deleteFile';
import type { PartRequestModel } from '../models/PartRequestModel';
import type { PartResponseModel } from '../models/PartResponseModel';
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
  const [name, setName] = useState<string>(part?.name || '');
  const [category, setCategory] = useState<string>(part?.category || 'General');
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

  const MAX_FILE_SIZE_MB = 10;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  const validateFile = (selectedFile: File): boolean => {
    if (!selectedFile.type.startsWith('image/')) {
      onError('Only image files are allowed.');
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
      e.target.value = ''; // Reset input
      return;
    }
    setFile(selectedFile);
  };

  React.useEffect(() => {
    if (part) {
      setName(part.name);
      setCategory(part.category || 'General');
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
      onError('Part name is required');
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
      onError('Failed to update part. Please try again.');
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
      onError('Failed to delete image. Please try again.');
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
              <label className="form-label" htmlFor="part-category">
                Category <span className="required">*</span>
              </label>
              <select
                id="part-category"
                className="form-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={submitting}
                required
              >
                <option value="General">General</option>
                <option value="Heating">Heating</option>
                <option value="Cooling">Cooling</option>
                <option value="Electronics">Electronics</option>
                <option value="Filtration">Filtration</option>
                <option value="Hardware">Hardware</option>
                <option value="Shelving">Shelving</option>
                <option value="Packaging">Packaging</option>
                <option value="Sensors">Sensors</option>
                <option value="Fluid Control">Fluid Control</option>
                <option value="Doors & Seals">Doors & Seals</option>
                <option value="Electrical">Electrical</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="part-quantity">
                Quantity <span className="required">*</span>
              </label>
              <input
                id="part-quantity"
                type="number"
                min="0"
                className="form-input"
                placeholder="Enter quantity"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                disabled={submitting}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="part-price">
                Price <span className="required">*</span>
              </label>
              <input
                id="part-price"
                type="number"
                min="0"
                step="0.01"
                className="form-input"
                placeholder="Enter price"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                disabled={submitting}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="part-supplier">
                Supplier <span className="required">*</span>
              </label>
              <input
                id="part-supplier"
                type="text"
                className="form-input"
                placeholder="Enter supplier name"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                disabled={submitting}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="part-low-threshold">
                Low Stock Threshold
              </label>
              <input
                id="part-low-threshold"
                type="number"
                min="0"
                className="form-input"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="part-out-threshold">
                Out of Stock Threshold
              </label>
              <input
                id="part-out-threshold"
                type="number"
                min="0"
                className="form-input"
                value={outOfStockThreshold}
                onChange={(e) => setOutOfStockThreshold(Number(e.target.value))}
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="part-high-threshold">
                High Stock Threshold
              </label>
              <input
                id="part-high-threshold"
                type="number"
                min="0"
                className="form-input"
                value={highStockThreshold}
                onChange={(e) => setHighStockThreshold(Number(e.target.value))}
                disabled={submitting}
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
                Replace Image (optional)
              </label>
              <input
                id="part-image"
                type="file"
                accept="image/*"
                className="form-input"
                disabled={submitting || imageDeleteLoading}
                onChange={handleFileChange}
              />
              <p className="helper-text">
                Maximum file size: {MAX_FILE_SIZE_MB} MB. Only image files allowed.
              </p>
              {currentImageFileId && (
                <div>
                  <div className="image-preview-container">
                    <img
                      src={`${import.meta.env.VITE_BACKEND_URL}/files/${currentImageFileId}/download`}
                      alt="Current part image"
                      style={{
                        maxWidth: '150px',
                        maxHeight: '120px',
                        borderRadius: '6px',
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                  <p className="helper-text">Upload a new image to replace it.</p>
                  <button
                    type="button"
                    className="btn-delete-image"
                    onClick={handleDeleteImage}
                    disabled={submitting || imageDeleteLoading}
                    aria-label="Delete current image"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Current Image
                  </button>
                </div>
              )}
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
              {submitting ? 'Updating...' : 'Update Part'}
            </button>
          </div>
        </form>
      </div>

      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        title="Delete Image"
        message="Are you sure you want to permanently delete this image?"
        confirmText="Delete"
        cancelText="Cancel"
        isDanger={true}
        isLoading={imageDeleteLoading}
        onConfirm={confirmDeleteImage}
        onCancel={() => setShowDeleteConfirmation(false)}
      />
    </div>
  );
}
