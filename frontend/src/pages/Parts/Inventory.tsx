import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Upload, Download, Trash2, Edit2, Search} from "lucide-react";
import { getAllParts } from "../../features/parts/api/getAllParts";
import { createPart } from "../../features/parts/api/createPart";
import { updatePart } from "../../features/parts/api/updatePart";
import { deletePart } from "../../features/parts/api/deletePart";
import type { PartResponseModel } from "../../features/parts/models/PartResponseModel";
import type { PartRequestModel } from "../../features/parts/models/PartRequestModel";
import "./Inventory.css";

const categories = ["All", "Compressors", "Sensors", "Coils", "Motors", "Refrigerants", "Electronics", "Accessories"];
const statuses = ["All", "In Stock", "Low Stock", "Out of Stock"];
const ITEMS_PER_PAGE = 15;

const Inventory = () => {
  const [parts, setParts] = useState<PartResponseModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedParts, setSelectedParts] = useState<string[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<PartResponseModel | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [newPart, setNewPart] = useState<Partial<PartRequestModel>>({
    name: "",
    category: "Compressors",
    quantity: 0,
    price: 0,
    supplier: "",
    lowStockThreshold: 5,
    outOfStockThreshold: 0,
    highStockThreshold: 50,
  });

  // Fetch parts on mount
  useEffect(() => {
    loadParts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadParts = async () => {
    setLoading(true);
    try {
      const data = await getAllParts();
      setParts(data);
    } catch (error) {
      showToast("Failed to load parts", "error");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (text: string, type: "success" | "error") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtered parts
  const filteredParts = useMemo(() => {
    return parts.filter((part) => {
      const matchesSearch =
        part.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        part.supplier.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "All" || part.category === categoryFilter;
      const matchesStatus = statusFilter === "All" || part.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [parts, searchQuery, categoryFilter, statusFilter]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredParts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedParts = filteredParts.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, statusFilter]);

  // Select all visible parts on current page
  const handleSelectAll = () => {
    if (selectedParts.length === paginatedParts.length && paginatedParts.length > 0) {
      setSelectedParts([]);
    } else {
      setSelectedParts(paginatedParts.map((p) => p.partId));
    }
  };

  // Toggle single part selection
  const togglePartSelection = (id: string) => {
    setSelectedParts((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  // Export to CSV
  const exportToCSV = (exportAll: boolean = false) => {
    const partsToExport = exportAll
      ? filteredParts
      : selectedParts.length > 0
      ? parts.filter((p) => selectedParts.includes(p.partId))
      : filteredParts;

    const headers = ["ID", "Name", "Category", "Quantity", "Price", "Supplier", "Status"];
    const csvContent = [
      headers.join(","),
      ...partsToExport.map((part) =>
        [
          part.partId,
          `"${part.name}"`,
          part.category,
          part.quantity,
          part.price.toFixed(2),
          `"${part.supplier}"`,
          part.status,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `inventory_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    showToast(`Exported ${partsToExport.length} parts to CSV`, "success");
  };

  // Import from CSV
  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter((line) => line.trim());

      let successCount = 0;
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
        const cleanValues = values.map((v) => v.replace(/^"|"$/g, "").trim());

        if (cleanValues.length >= 7) {
          try {
            const partData: PartRequestModel = {
              name: cleanValues[1] || "",
              category: cleanValues[3] || "Accessories",
              quantity: parseInt(cleanValues[4]) || 0,
              price: parseFloat(cleanValues[5]) || 0,
              supplier: cleanValues[6] || "",
            } as PartRequestModel;
            await createPart(partData);
            successCount++;
          } catch (error) {
            console.error("Failed to import part:", error);
          }
        }
      }

      if (successCount > 0) {
        loadParts();
        showToast(`Imported ${successCount} parts from CSV`, "success");
      } else {
        showToast("No valid parts found in CSV file", "error");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  // Add new part
  const handleAddPart = async () => {
    if (!newPart.name) {
      showToast("Name is required", "error");
      return;
    }

    try {
      const partData: PartRequestModel = {
        name: newPart.name,
        category: newPart.category || "Accessories",
        quantity: newPart.quantity || 0,
        price: newPart.price || 0,
        supplier: newPart.supplier || "",
        lowStockThreshold: newPart.lowStockThreshold,
        outOfStockThreshold: newPart.outOfStockThreshold,
        highStockThreshold: newPart.highStockThreshold,
      };

      await createPart(partData);
      loadParts();
      setNewPart({
        name: "",
        category: "Compressors",
        quantity: 0,
        price: 0,
        supplier: "",
        lowStockThreshold: 5,
        outOfStockThreshold: 0,
        highStockThreshold: 50,
      });
      setIsAddDialogOpen(false);
      showToast("Part added successfully", "success");
    } catch (error) {
      showToast("Failed to add part", "error");
      console.error(error);
    }
  };

  // Update part
  const handleUpdatePart = async () => {
    if (!editingPart) return;

    try {
      const partData: PartRequestModel = {
        name: editingPart.name,
        category: editingPart.category,
        quantity: editingPart.quantity,
        price: editingPart.price,
        supplier: editingPart.supplier,
        lowStockThreshold: editingPart.lowStockThreshold,
        outOfStockThreshold: editingPart.outOfStockThreshold,
        highStockThreshold: editingPart.highStockThreshold,
        available: editingPart.available,
      };

      await updatePart(editingPart.partId, partData);
      loadParts();
      setEditingPart(null);
      showToast("Part updated successfully", "success");
    } catch (error) {
      showToast("Failed to update part", "error");
      console.error(error);
    }
  };

  // Delete parts
  const handleDeleteSelected = async () => {
    if (selectedParts.length === 0) return;

    try {
      await Promise.all(selectedParts.map((partId) => deletePart(partId)));
      loadParts();
      showToast(`${selectedParts.length} parts deleted`, "success");
      setSelectedParts([]);
    } catch (error) {
      showToast("Failed to delete parts", "error");
      console.error(error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Stock":
        return "status-in-stock";
      case "Low Stock":
        return "status-low-stock";
      case "Out of Stock":
        return "status-out-of-stock";
      default:
        return "";
    }
  };

  return (
    <div className="inventory-page">
      {/* Main Content */}
      <main className="container main-content">
        {/* Title */}
        <div className="page-header">
          <div className="page-title-section">
            <h1 className="page-title">Parts Inventory</h1>
            <p className="page-subtitle">Manage your repair parts and supplies</p>
          </div>
        </div>

        {/* Filters + Actions */}
        <div className="filter-bar">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search parts by name or supplier..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-controls">
            <select value={categoryFilter} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategoryFilter(e.target.value)} className="filter-select">
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <select value={statusFilter} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)} className="filter-select">
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="filters-actions">
            <motion.button 
              className="btn btn-primary btn-compact" 
              onClick={() => setIsAddDialogOpen(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus size={16} />
              Add
            </motion.button>

            <label className="btn btn-outline btn-compact">
              <Upload size={16} />
              Import
              <input type="file" accept=".csv" onChange={handleImportCSV} style={{ display: "none" }} />
            </label>

            <div className="dropdown">
              <button className="btn btn-outline btn-compact dropdown-toggle">
                <Download size={16} />
                Export
              </button>
              <div className="dropdown-menu">
                <button onClick={() => exportToCSV(true)} className="dropdown-item">
                  Export All ({filteredParts.length})
                </button>
                {selectedParts.length > 0 && (
                  <button onClick={() => exportToCSV(false)} className="dropdown-item">
                    Export Selected ({selectedParts.length})
                  </button>
                )}
              </div>
            </div>

            <AnimatePresence>
              {selectedParts.length > 0 && (
                <motion.button 
                  className="btn btn-danger btn-compact" 
                  onClick={handleDeleteSelected}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Trash2 size={16} />
                  Delete ({selectedParts.length})
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Table */}
        <div className="table-container">
          <table className="parts-table">
            <thead>
              <tr>
                <th className="checkbox-col">
                  <input
                    type="checkbox"
                    checked={selectedParts.length === paginatedParts.length && paginatedParts.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>Name</th>
                <th>Part ID</th>
                <th>Category</th>
                <th className="text-right qty-col">Qty</th>
                <th className="text-right price-col">Price</th>
                <th>Supplier</th>
                <th className="status-col">Status</th>
                <th className="actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="empty-state">
                    Loading parts...
                  </td>
                </tr>
              ) : filteredParts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="empty-state">
                    No parts found. Try adjusting your filters or add a new part.
                  </td>
                </tr>
              ) : (
                paginatedParts.map((part, index) => (
                  <motion.tr
                    key={part.partId}
                    className={selectedParts.includes(part.partId) ? "row-selected" : ""}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedParts.includes(part.partId)}
                        onChange={() => togglePartSelection(part.partId)}
                      />
                    </td>
                    <td className="part-name">{part.name}</td>
                    <td className="sku-code">{part.partId}</td>
                    <td>{part.category}</td>
                    <td className="text-right qty-col">{part.quantity}</td>
                    <td className="text-right price-col">${part.price.toFixed(2)}</td>
                    <td>{part.supplier}</td>
                    <td className="status-col">
                      <span className={`status-badge-part ${getStatusColor(part.status)}`}>{part.status}</span>
                    </td>
                    <td className="actions-col">
                      <motion.button 
                        className="icon-btn" 
                        onClick={() => setEditingPart(part)} 
                        title="Edit"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Edit2 size={16} />
                      </motion.button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Stats Footer */}
        <div className="stats-footer">
          <span>Total Parts: {filteredParts.length}</span>
          <span>•</span>
          <span>Total Value: ${filteredParts.reduce((sum, p) => sum + p.price * p.quantity, 0).toFixed(2)}</span>
          <span>•</span>
          <span>Low Stock: {filteredParts.filter((p) => p.status === "Low Stock").length}</span>
          <span>•</span>
          <span>Out of Stock: {filteredParts.filter((p) => p.status === "Out of Stock").length}</span>
        </div>

        {/* Pagination Controls */}
        {filteredParts.length > 0 && (
          <>
            <div className="parts-pagination">
              <motion.button
                className="pagination-btn pagination-prev"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ← Previous
              </motion.button>

              <div className="pagination-pages">
                {(() => {
                  const PAGES_TO_SHOW = 5;
                  const startPage = Math.max(1, currentPage - Math.floor(PAGES_TO_SHOW / 2));
                  const endPage = Math.min(totalPages, startPage + PAGES_TO_SHOW - 1);
                  const displayStartPage = Math.max(1, endPage - PAGES_TO_SHOW + 1);
                  
                  return Array.from({ length: endPage - displayStartPage + 1 }, (_, i) => displayStartPage + i).map((page) => (
                    <motion.button
                      key={page}
                      className={`pagination-page ${currentPage === page ? "active" : ""}`}
                      onClick={() => setCurrentPage(page)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {page}
                    </motion.button>
                  ));
                })()}
              </div>

              <motion.button
                className="pagination-btn pagination-next"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Next →
              </motion.button>
            </div>
            <div className="pagination-info">
              Page {currentPage} of {totalPages} • Showing {paginatedParts.length} of {filteredParts.length} parts
            </div>
          </>
        )}
      </main>

      {/* Add Dialog */}
      <AnimatePresence>
        {isAddDialogOpen && (
          <motion.div 
            className="modal-overlay" 
            onClick={() => setIsAddDialogOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="modal-content" 
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
            >
              <div className="modal-header">
                <h2>Add New Part</h2>
                <button className="close-btn" onClick={() => setIsAddDialogOpen(false)}>
                  ×
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    value={newPart.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPart((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Part name"
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={newPart.category}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewPart((p) => ({ ...p, category: e.target.value }))}
                  >
                    {categories
                      .filter((c) => c !== "All")
                      .map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Quantity</label>
                    <input
                      type="number"
                      value={newPart.quantity}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPart((p) => ({ ...p, quantity: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newPart.price}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPart((p) => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Supplier</label>
                  <input
                    value={newPart.supplier}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPart((p) => ({ ...p, supplier: e.target.value }))}
                    placeholder="Supplier name"
                  />
                </div>
                <button onClick={handleAddPart} className="btn btn-primary btn-block">
                  Add Part
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Dialog */}
      <AnimatePresence>
        {editingPart && (
          <motion.div 
            className="modal-overlay" 
            onClick={() => setEditingPart(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="modal-content" 
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
            >
              <div className="modal-header">
                <h2>Edit Part</h2>
                <button className="close-btn" onClick={() => setEditingPart(null)}>
                  ×
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Name</label>
                  <input
                    value={editingPart.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditingPart((p) => (p ? { ...p, name: e.target.value } : null))
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={editingPart.category}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setEditingPart((p) => (p ? { ...p, category: e.target.value } : null))
                    }
                  >
                    {categories
                      .filter((c) => c !== "All")
                      .map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Quantity</label>
                    <input
                      type="number"
                      value={editingPart.quantity}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEditingPart((p) =>
                          p ? { ...p, quantity: parseInt(e.target.value) || 0 } : null
                        )
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingPart.price}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEditingPart((p) =>
                          p ? { ...p, price: parseFloat(e.target.value) || 0 } : null
                        )
                      }
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Supplier</label>
                  <input
                    value={editingPart.supplier}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditingPart((p) => (p ? { ...p, supplier: e.target.value } : null))
                    }
                  />
                </div>
                <div className="modal-actions">
                  <button onClick={handleUpdatePart} className="btn btn-primary">
                    Save Changes
                  </button>
                  <button onClick={() => setEditingPart(null)} className="btn btn-outline">
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            className={`toast toast-${toastMessage.type}`}
            initial={{ opacity: 0, x: 100, y: 0 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 100, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {toastMessage.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Inventory;
