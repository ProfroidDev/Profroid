import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getAllParts } from "../../features/parts/api/getAllParts";
import { deletePart } from "../../features/parts/api/deletePart";
import type { PartResponseModel } from "../../features/parts/models/PartResponseModel";
import PartDetailModal from "../../features/parts/components/PartDetailModal";
import PartAddModal from "../../features/parts/components/PartAddModal";
import PartEditModal from "../../features/parts/components/PartEditModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import Toast from "../../shared/components/Toast";
import "./PartsPage.css";

const ITEMS_PER_PAGE = 12;

export default function PartsPage(): React.ReactElement {
  const { t } = useTranslation();
  const [parts, setParts] = useState<PartResponseModel[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedPart, setSelectedPart] = useState<PartResponseModel | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [addModalOpen, setAddModalOpen] = useState<boolean>(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [deleteTarget, setDeleteTarget] = useState<PartResponseModel | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getAllParts();
        console.log("Parts fetched:", data);
        setParts(data);
      } catch (error) {
        console.error("Error fetching parts:", error);
        setToast({ message: "Failed to load parts", type: "error" });
      } finally {
        setLoading(false);
      }
    }

    load();
    setCurrentPage(1);
  }, []);

  const filteredParts = parts.filter((part) =>
    part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.partId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resolveImage = (part: PartResponseModel) =>
    part.imageFileId
      ? `${import.meta.env.VITE_BACKEND_URL}/files/${part.imageFileId}/download`
      : `https://via.placeholder.com/300x300?text=${encodeURIComponent(part.name)}`;

  const totalPages = Math.ceil(filteredParts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentParts = filteredParts.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
  };

  const PAGES_TO_SHOW = 3;
  const startPage = Math.max(1, currentPage - Math.floor(PAGES_TO_SHOW / 2));
  const endPage = Math.min(totalPages, startPage + PAGES_TO_SHOW - 1);
  const displayStartPage = Math.max(1, endPage - PAGES_TO_SHOW + 1);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleViewDetails = (part: PartResponseModel) => {
    setSelectedPart(part);
    setDetailModalOpen(true);
  };

  const handleCloseModal = () => {
    setDetailModalOpen(false);
    setSelectedPart(null);
  };

  const handleOpenAddModal = () => {
    setAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setAddModalOpen(false);
  };

  const handlePartAdded = async () => {
    setToast({ message: "Part added successfully!", type: "success" });
    // Reload parts
    try {
      const data = await getAllParts();
      setParts(data);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error reloading parts:", error);
    }
  };

  const handleAddError = (message: string) => {
    setToast({ message, type: "error" });
  };

  const handleOpenEditModal = (part: PartResponseModel) => {
    setSelectedPart(part);
    setDetailModalOpen(false);
    setEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
  };

  const handlePartUpdated = async () => {
    setToast({ message: "Part updated successfully!", type: "success" });
    // Reload parts
    try {
      const data = await getAllParts();
      setParts(data);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error reloading parts:", error);
    }
  };

  const handleEditError = (message: string) => {
    setToast({ message, type: "error" });
  };

  const handleOpenDeleteConfirm = (part: PartResponseModel) => {
    setDeleteTarget(part);
    setDeleteError(null);
    setDeleteModalOpen(true);
  };

  const handleCloseDeleteConfirm = () => {
    setDeleteModalOpen(false);
    setDeleteTarget(null);
    setDeleteError(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setDeleteLoading(true);
    setDeleteError(null);

    try {
      await deletePart(deleteTarget.partId);
      setParts((prev) => prev.filter((p) => p.partId !== deleteTarget.partId));
      setToast({ message: "Part deleted successfully!", type: "success" });
      handleCloseDeleteConfirm();
    } catch (error) {
      console.error("Error deleting part:", error);
      setDeleteError("Failed to delete part. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="parts-page-light">
      <div className="page-header">
        <h1 className="parts-title-light">{t('pages.parts.title')}</h1>
        <button className="btn-add-part" onClick={handleOpenAddModal}>
          + {t('pages.parts.addPart')}
        </button>
      </div>

      <div className="search-container">
        <input
          type="text"
          className="search-bar"
          placeholder={t('pages.parts.name')}
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>

      {loading ? (
        <div className="parts-loading">{t('common.loading')}</div>
      ) : parts.length === 0 ? (
        <div className="parts-empty">{t('pages.parts.noParts')}</div>
      ) : filteredParts.length === 0 ? (
        <div className="parts-empty">No parts match your search</div>
      ) : (
        <>
          <div className="parts-grid">
            {currentParts.map((part) => (
            <div key={part.partId} className="part-card-light">
              <div className="part-image-container">
                <img
                  src={resolveImage(part)}
                  alt={part.name}
                  className="part-image"
                />
              </div>
              <div className="part-card-content">
                <h2 className="part-card-title">{part.name}</h2>
                <div className="part-card-details">
                  <p className="part-id">
                    <span className="part-label">Part ID:</span>
                    <span className="part-value">{part.partId}</span>
                  </p>
                </div>
                <div className="part-card-buttons">
                  <button className="btn-view-part" onClick={() => handleViewDetails(part)}>View Details</button>
                  <button className="btn-edit-part" onClick={() => handleOpenEditModal(part)}>Edit</button>
                  <button className="btn-delete-part" onClick={() => handleOpenDeleteConfirm(part)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
          </div>

          <div className="parts-pagination">
            <button
              className="pagination-btn pagination-prev"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
            >
              ← Previous
            </button>

            <div className="pagination-pages">
              {Array.from({ length: endPage - displayStartPage + 1 }, (_, i) => displayStartPage + i).map((page) => (
                <button
                  key={page}
                  className={`pagination-page ${currentPage === page ? 'active' : ''}`}
                  onClick={() => handlePageClick(page)}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              className="pagination-btn pagination-next"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              Next →
            </button>
          </div>
          <div className="pagination-info">
            Page {currentPage} of {totalPages} • Showing {currentParts.length} of {parts.length} parts
          </div>
        </>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <ConfirmationModal
        isOpen={deleteModalOpen}
        title={t('pages.parts.deletePart')}
        message={
          deleteError ??
          `${t('messages.confirmDelete')}`
        }
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        isDanger
        isLoading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={handleCloseDeleteConfirm}
      />

      <PartDetailModal
        part={selectedPart}
        isOpen={detailModalOpen}
        onClose={handleCloseModal}
      />

      <PartEditModal
        part={selectedPart}
        isOpen={editModalOpen}
        onClose={handleCloseEditModal}
        onPartUpdated={handlePartUpdated}
        onError={handleEditError}
      />

      <PartAddModal
        isOpen={addModalOpen}
        onClose={handleCloseAddModal}
        onPartAdded={handlePartAdded}
        onError={handleAddError}
      />
    </div>
  );
}
