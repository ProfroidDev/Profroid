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
  const [category, setCategory] = useState<string>("General");
  const [quantity, setQuantity] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);
  const [supplier, setSupplier] = useState<string>("");
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);
  const [outOfStockThreshold, setOutOfStockThreshold] = useState<number>(0);
  const [highStockThreshold, setHighStockThreshold] = useState<number>(100);
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
      setName("");
      setCategory("General");
      setQuantity(0);
      setPrice(0);
      setSupplier("");
      setLowStockThreshold(5);
      setOutOfStockThreshold(0);
      setHighStockThreshold(100);
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
      setCategory("General");
      setQuantity(0);
      setPrice(0);
      setSupplier("");
      setLowStockThreshold(5);
      setOutOfStockThreshold(0);
      setHighStockThreshold(100);
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
