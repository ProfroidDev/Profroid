import React, { useEffect, useState } from "react";
import { getAllParts } from "../../features/parts/api/getAllParts";
import type { PartResponseModel } from "../../features/parts/models/PartResponseModel";
import Toast from "../../shared/components/Toast";
import "./PartsPage.css";

const ITEMS_PER_PAGE = 12;

export default function PartsPage(): React.ReactElement {
  const [parts, setParts] = useState<PartResponseModel[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
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

  return (
    <div className="parts-page-light">
      <h1 className="parts-title-light">Parts Catalog</h1>

      <div className="search-container">
        <input
          type="text"
          className="search-bar"
          placeholder="Search by part name or ID..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>

      {loading ? (
        <div className="parts-loading">Loading parts...</div>
      ) : parts.length === 0 ? (
        <div className="parts-empty">No parts available</div>
      ) : filteredParts.length === 0 ? (
        <div className="parts-empty">No parts match your search</div>
      ) : (
        <>
          <div className="parts-grid">
            {currentParts.map((part) => (
            <div key={part.partId} className="part-card-light">
              <div className="part-image-container">
                <img
                  src={`https://via.placeholder.com/300x300?text=${encodeURIComponent(part.name)}`}
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
                <button className="btn-view-part">View Details</button>
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
    </div>
  );
}
