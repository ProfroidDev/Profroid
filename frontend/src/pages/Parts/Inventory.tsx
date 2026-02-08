import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Download, Edit2, Search, X, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { sanitizeInput } from '../../utils/sanitizer';
import { getAllParts } from '../../features/parts/api/getAllParts';
import { createPart } from '../../features/parts/api/createPart';
import { updatePart } from '../../features/parts/api/updatePart';
import { exportInventoryPdf } from '../../features/parts/api/exportInventoryPdf';
import type { PartResponseModel } from '../../features/parts/models/PartResponseModel';
import type { PartRequestModel } from '../../features/parts/models/PartRequestModel';
import './Inventory.css';

const ITEMS_PER_PAGE = 15;

interface FilterOption {
  label: string;
  category?: string;
  status?: string;
}

const filterOptions: FilterOption[] = [
  { label: 'pages.parts.inventory.filterAll', category: 'All', status: 'All' },
  { label: 'pages.parts.inventory.categoriesLabel', category: '', status: '' },
  { label: 'pages.parts.inventory.categories.compressors', category: 'Compressors', status: '' },
  { label: 'pages.parts.inventory.categories.sensors', category: 'Sensors', status: '' },
  { label: 'pages.parts.inventory.categories.coils', category: 'Coils', status: '' },
  { label: 'pages.parts.inventory.categories.motors', category: 'Motors', status: '' },
  { label: 'pages.parts.inventory.categories.refrigerants', category: 'Refrigerants', status: '' },
  { label: 'pages.parts.inventory.categories.electronics', category: 'Electronics', status: '' },
  { label: 'pages.parts.inventory.categories.accessories', category: 'Accessories', status: '' },
  { label: 'pages.parts.inventory.statusLabel', category: '', status: '' },
  { label: 'pages.parts.inventory.status.inStock', category: '', status: 'In Stock' },
  { label: 'pages.parts.inventory.status.lowStock', category: '', status: 'Low Stock' },
  { label: 'pages.parts.inventory.status.outOfStock', category: '', status: 'Out of Stock' },
];

const Inventory = () => {
  const { t } = useTranslation();
  const [parts, setParts] = useState<PartResponseModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedParts, setSelectedParts] = useState<string[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<PartResponseModel | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);
  const [newPart, setNewPart] = useState<Partial<PartRequestModel>>({
    name: '',
    category: 'Compressors',
    quantity: 0,
    price: 0,
    supplier: '',
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
      showToast(t('messages.failedToLoadParts'), 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (text: string, type: 'success' | 'error') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('All');
    setStatusFilter('All');
  };

  const getCurrentFilterLabel = () => {
    const filters = [];
    if (categoryFilter !== 'All') {
      filters.push(categoryFilter);
    }
    if (statusFilter !== 'All') {
      filters.push(statusFilter);
    }
    if (filters.length === 0) {
      return t('pages.parts.inventory.filterAll');
    }
    return filters.join(' • ');
  };

  // Filtered parts
  const filteredParts = useMemo(() => {
    return parts.filter((part) => {
      const matchesSearch =
        part.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        part.supplier.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || part.category === categoryFilter;
      const matchesStatus = statusFilter === 'All' || part.status === statusFilter;
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

    const headers = ['ID', 'Name', 'Category', 'Quantity', 'Price', 'Supplier', 'Status'];
    const csvContent = [
      headers.join(','),
      ...partsToExport.map((part) =>
        [
          part.partId,
          `"${part.name}"`,
          part.category,
          part.quantity,
          part.price.toFixed(2),
          `"${part.supplier}"`,
          part.status,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `inventory_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    showToast(t('messages.exportedPartsToCSV', { count: partsToExport.length }), 'success');
  };

  // Export to PDF
  const exportToPDF = async () => {
    try {
      console.log('Starting PDF export...');
      const blob = await exportInventoryPdf();

      console.log('Blob size:', blob.size, 'Blob type:', blob.type);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `inventory_report_${new Date().toISOString().split('T')[0]}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);

      showToast(t('messages.pdfExportedSuccessfully'), 'success');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      showToast(t('messages.failedToExportPDF'), 'error');
    }
  };

  // Add new part
  const handleAddPart = async () => {
    if (!newPart.name) {
      showToast(t('messages.nameIsRequired'), 'error');
      return;
    }

    try {
      const partData: PartRequestModel = {
        name: newPart.name,
        category: newPart.category || 'Accessories',
        quantity: newPart.quantity || 0,
        price: newPart.price || 0,
        supplier: newPart.supplier || '',
        lowStockThreshold: newPart.lowStockThreshold,
        outOfStockThreshold: newPart.outOfStockThreshold,
        highStockThreshold: newPart.highStockThreshold,
      };

      await createPart(partData);
      loadParts();
      setNewPart({
        name: '',
        category: 'Compressors',
        quantity: 0,
        price: 0,
        supplier: '',
        lowStockThreshold: 5,
        outOfStockThreshold: 0,
        highStockThreshold: 50,
      });
      setIsAddDialogOpen(false);
      showToast(t('messages.partAddedSuccessfullyMessage'), 'success');
    } catch (error) {
      showToast(t('messages.failedToAddPart'), 'error');
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
      showToast(t('messages.partUpdatedSuccessfullyMessage'), 'success');
    } catch (error) {
      showToast(t('messages.failedToUpdatePartMessage'), 'error');
      console.error(error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Stock':
        return 'status-in-stock';
      case 'Low Stock':
        return 'status-low-stock';
      case 'Out of Stock':
        return 'status-out-of-stock';
      default:
        return '';
    }
  };

  return (
    <div className="inventory-page">
      {/* Main Content */}
      <main className="container main-content">
        {/* Title */}
        <div className="page-header">
          <div className="page-title-section">
            <h1 className="page-title">{t('pages.parts.inventory.title')}</h1>
            <p className="page-subtitle">{t('pages.parts.inventory.subtitle')}</p>
          </div>
        </div>

        {/* Filters + Actions */}
        <div className="filter-bar-inventory">
          <div className="search-box-inventory">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder={t('pages.parts.inventory.searchPlaceholder')}
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchQuery(sanitizeInput(e.target.value))
              }
              className="search-input"
            />
          </div>

          <div className="filter-controls">
            <select
              value={`${categoryFilter}|${statusFilter}`}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                const [cat, status] = e.target.value.split('|');
                if (cat !== '') setCategoryFilter(cat);
                if (status !== '') setStatusFilter(status);
              }}
              className="filter-select"
            >
              {filterOptions.map((option, idx) => (
                <option
                  key={idx}
                  value={`${option.category || ''}|${option.status || ''}`}
                  disabled={option.category === '' && option.status === ''}
                  style={
                    option.category === '' && option.status === '' ? { fontWeight: 'bold' } : {}
                  }
                >
                  {t(option.label)}
                </option>
              ))}
            </select>
            <div className="filter-indicator">{getCurrentFilterLabel()}</div>
          </div>

          <div className="filters-actions">
            <motion.button
              className="btn btn-outline btn-compact"
              onClick={resetFilters}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={t('pages.parts.inventory.buttons.resetFilters')}
            >
              <RotateCcw size={16} />
              {t('pages.parts.inventory.buttons.resetFilters')}
            </motion.button>

            <motion.button
              className="btn btn-primary btn-compact"
              onClick={() => setIsAddDialogOpen(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus size={16} />
              {t('pages.parts.inventory.buttons.add')}
            </motion.button>

            <div className="dropdown">
              <button className="btn btn-outline btn-compact dropdown-toggle">
                <Download size={16} />
                {t('pages.parts.inventory.buttons.export')}
              </button>
              <div className="dropdown-menu">
                <button onClick={() => exportToCSV(true)} className="dropdown-item">
                  {t('pages.parts.inventory.export.exportAll', { count: filteredParts.length })}
                </button>
                {selectedParts.length > 0 && (
                  <button onClick={() => exportToCSV(false)} className="dropdown-item">
                    {t('pages.parts.inventory.export.exportSelected', {
                      count: selectedParts.length,
                    })}
                  </button>
                )}
              </div>
            </div>

            <motion.button
              className="btn btn-outline btn-compact"
              onClick={exportToPDF}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Download size={16} />
              {t('pages.parts.inventory.buttons.pdf')}
            </motion.button>
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
                    checked={
                      selectedParts.length === paginatedParts.length && paginatedParts.length > 0
                    }
                    onChange={handleSelectAll}
                  />
                </th>
                <th>{t('pages.parts.inventory.table.name')}</th>
                <th>{t('pages.parts.inventory.table.partId')}</th>
                <th>{t('pages.parts.inventory.table.category')}</th>
                <th className="text-right qty-col">{t('pages.parts.inventory.table.qty')}</th>
                <th className="text-right price-col">{t('pages.parts.inventory.table.price')}</th>
                <th>{t('pages.parts.inventory.table.supplier')}</th>
                <th className="status-col">{t('pages.parts.inventory.table.status')}</th>
                <th className="actions-col">{t('pages.parts.inventory.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="empty-state">
                    {t('pages.parts.inventory.loading')}
                  </td>
                </tr>
              ) : filteredParts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="empty-state">
                    {t('pages.parts.inventory.noPartsFound')}
                  </td>
                </tr>
              ) : (
                paginatedParts.map((part, index) => (
                  <motion.tr
                    key={part.partId}
                    className={selectedParts.includes(part.partId) ? 'row-selected' : ''}
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
                      <span className={`status-badge-part ${getStatusColor(part.status)}`}>
                        {part.status}
                      </span>
                    </td>
                    <td className="actions-col">
                      <motion.button
                        className="icon-btn"
                        onClick={() => setEditingPart(part)}
                        title={t('pages.parts.inventory.buttons.edit')}
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
          <span>
            {t('pages.parts.inventory.stats.totalParts')}: {filteredParts.length}
          </span>
          <span>•</span>
          <span>
            {t('pages.parts.inventory.stats.totalValue')}: $
            {filteredParts.reduce((sum, p) => sum + p.price * p.quantity, 0).toFixed(2)}
          </span>
          <span>•</span>
          <span>
            {t('pages.parts.inventory.stats.lowStock')}:{' '}
            {filteredParts.filter((p) => p.status === 'Low Stock').length}
          </span>
          <span>•</span>
          <span>
            {t('pages.parts.inventory.stats.outOfStock')}:{' '}
            {filteredParts.filter((p) => p.status === 'Out of Stock').length}
          </span>
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
                {t('pages.parts.inventory.pagination.previous')}
              </motion.button>

              <div className="pagination-pages">
                {(() => {
                  const PAGES_TO_SHOW = 5;
                  const startPage = Math.max(1, currentPage - Math.floor(PAGES_TO_SHOW / 2));
                  const endPage = Math.min(totalPages, startPage + PAGES_TO_SHOW - 1);
                  const displayStartPage = Math.max(1, endPage - PAGES_TO_SHOW + 1);

                  return Array.from(
                    { length: endPage - displayStartPage + 1 },
                    (_, i) => displayStartPage + i
                  ).map((page) => (
                    <motion.button
                      key={page}
                      className={`pagination-page ${currentPage === page ? 'active' : ''}`}
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
                {t('pages.parts.inventory.pagination.next')}
              </motion.button>
            </div>
            <div className="pagination-info">
              {t('pages.parts.inventory.pagination.pageInfo', {
                current: currentPage,
                total: totalPages,
                showing: paginatedParts.length,
                filtered: filteredParts.length,
              })}
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
              <div className="modal-header inventory-modal-header">
                <h2 className="modal-title inventory-modal-title">
                  {t('pages.parts.inventory.modal.addTitle')}
                </h2>
                <button
                  className="modal-close"
                  onClick={() => setIsAddDialogOpen(false)}
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newPart.name?.trim()) {
                    showToast(t('pages.parts.inventory.modal.validation.nameRequired'), 'error');
                    return;
                  }
                  handleAddPart();
                }}
              >
                <div className="modal-body">
                  <div className="inventory-form-group">
                    <label htmlFor="add-name" className="form-label">
                      {t('pages.parts.inventory.modal.fields.name')}{' '}
                      <span className="required">*</span>
                    </label>
                    <input
                      id="add-name"
                      type="text"
                      className="form-input"
                      placeholder={t('pages.parts.inventory.modal.placeholders.name')}
                      value={newPart.name || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewPart((p) => ({ ...p, name: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="inventory-form-group">
                    <label htmlFor="add-category" className="form-label">
                      {t('pages.parts.inventory.modal.fields.category')}{' '}
                      <span className="required">*</span>
                    </label>
                    <select
                      id="add-category"
                      className="form-input"
                      value={newPart.category || 'Compressors'}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        setNewPart((p) => ({ ...p, category: e.target.value }))
                      }
                      required
                    >
                      {[
                        'Compressors',
                        'Sensors',
                        'Coils',
                        'Motors',
                        'Refrigerants',
                        'Electronics',
                        'Accessories',
                      ].map((cat) => (
                        <option key={cat} value={cat}>
                          {t(`pages.parts.inventory.categories.${cat.toLowerCase()}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="inventory-form-row">
                    <div className="inventory-form-group">
                      <label htmlFor="add-quantity" className="form-label">
                        {t('pages.parts.inventory.modal.fields.quantity')}{' '}
                        <span className="required">*</span>
                      </label>
                      <input
                        id="add-quantity"
                        type="text"
                        inputMode="numeric"
                        className="form-input"
                        placeholder={t('pages.parts.inventory.modal.placeholders.quantity')}
                        value={newPart.quantity || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setNewPart((p) => ({ ...p, quantity: parseInt(e.target.value) || 0 }))
                        }
                        required
                      />
                    </div>
                    <div className="inventory-form-group">
                      <label htmlFor="add-price" className="form-label">
                        {t('pages.parts.inventory.modal.fields.price')}{' '}
                        <span className="required">*</span>
                      </label>
                      <input
                        id="add-price"
                        type="text"
                        inputMode="decimal"
                        className="form-input"
                        placeholder={t('pages.parts.inventory.modal.placeholders.price')}
                        value={newPart.price || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setNewPart((p) => ({ ...p, price: parseFloat(e.target.value) || 0 }))
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="inventory-form-group">
                    <label htmlFor="add-supplier" className="form-label">
                      {t('pages.parts.inventory.modal.fields.supplier')}{' '}
                      <span className="required">*</span>
                    </label>
                    <input
                      id="add-supplier"
                      type="text"
                      className="form-input"
                      placeholder={t('pages.parts.inventory.modal.placeholders.supplier')}
                      value={newPart.supplier || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewPart((p) => ({ ...p, supplier: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="inventory-form-row">
                    <div className="inventory-form-group">
                      <label htmlFor="add-low-threshold" className="form-label">
                        {t('pages.parts.inventory.modal.fields.lowStockThreshold')}
                      </label>
                      <input
                        id="add-low-threshold"
                        type="text"
                        inputMode="numeric"
                        className="form-input"
                        value={newPart.lowStockThreshold || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setNewPart((p) => ({
                            ...p,
                            lowStockThreshold: parseInt(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                    <div className="inventory-form-group">
                      <label htmlFor="add-out-threshold" className="form-label">
                        {t('pages.parts.inventory.modal.fields.outOfStockThreshold')}
                      </label>
                      <input
                        id="add-out-threshold"
                        type="text"
                        inputMode="numeric"
                        className="form-input"
                        value={newPart.outOfStockThreshold || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setNewPart((p) => ({
                            ...p,
                            outOfStockThreshold: parseInt(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="inventory-form-group">
                    <label htmlFor="add-high-threshold" className="form-label">
                      {t('pages.parts.inventory.modal.fields.highStockThreshold')}
                    </label>
                    <input
                      id="add-high-threshold"
                      type="text"
                      inputMode="numeric"
                      className="form-input"
                      value={newPart.highStockThreshold || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewPart((p) => ({
                          ...p,
                          highStockThreshold: parseInt(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    {t('pages.parts.inventory.modal.buttons.cancel')}
                  </button>
                  <button type="submit" className="btn-submit">
                    {t('pages.parts.inventory.modal.buttons.addPart')}
                  </button>
                </div>
              </form>
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
              <div className="modal-header inventory-modal-header">
                <h2 className="modal-title inventory-modal-title">
                  {t('pages.parts.inventory.modal.editTitle')}
                </h2>
                <button
                  className="modal-close"
                  onClick={() => setEditingPart(null)}
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!editingPart?.name?.trim()) {
                    showToast(t('pages.parts.inventory.modal.validation.nameRequired'), 'error');
                    return;
                  }
                  handleUpdatePart();
                }}
              >
                <div className="modal-body">
                  <div className="inventory-form-group">
                    <label htmlFor="edit-name" className="form-label">
                      {t('pages.parts.inventory.modal.fields.name')}{' '}
                      <span className="required">*</span>
                    </label>
                    <input
                      id="edit-name"
                      type="text"
                      className="form-input"
                      placeholder={t('pages.parts.inventory.modal.placeholders.name')}
                      value={editingPart?.name || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEditingPart((p) => (p ? { ...p, name: e.target.value } : null))
                      }
                      required
                    />
                  </div>
                  <div className="inventory-form-group">
                    <label htmlFor="edit-category" className="form-label">
                      {t('pages.parts.inventory.modal.fields.category')}{' '}
                      <span className="required">*</span>
                    </label>
                    <select
                      id="edit-category"
                      className="form-input"
                      value={editingPart?.category || 'Compressors'}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        setEditingPart((p) => (p ? { ...p, category: e.target.value } : null))
                      }
                      required
                    >
                      {[
                        'Compressors',
                        'Sensors',
                        'Coils',
                        'Motors',
                        'Refrigerants',
                        'Electronics',
                        'Accessories',
                      ].map((cat) => (
                        <option key={cat} value={cat}>
                          {t(`pages.parts.inventory.categories.${cat.toLowerCase()}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="inventory-form-row">
                    <div className="inventory-form-group">
                      <label htmlFor="edit-quantity" className="form-label">
                        {t('pages.parts.inventory.modal.fields.quantity')}{' '}
                        <span className="required">*</span>
                      </label>
                      <input
                        id="edit-quantity"
                        type="text"
                        inputMode="numeric"
                        className="form-input"
                        placeholder={t('pages.parts.inventory.modal.placeholders.quantity')}
                        value={editingPart?.quantity || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setEditingPart((p) =>
                            p ? { ...p, quantity: parseInt(e.target.value) || 0 } : null
                          )
                        }
                        required
                      />
                    </div>
                    <div className="inventory-form-group">
                      <label htmlFor="edit-price" className="form-label">
                        {t('pages.parts.inventory.modal.fields.price')}{' '}
                        <span className="required">*</span>
                      </label>
                      <input
                        id="edit-price"
                        type="text"
                        inputMode="decimal"
                        className="form-input"
                        placeholder={t('pages.parts.inventory.modal.placeholders.price')}
                        value={editingPart?.price || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setEditingPart((p) =>
                            p ? { ...p, price: parseFloat(e.target.value) || 0 } : null
                          )
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="inventory-form-group">
                    <label htmlFor="edit-supplier" className="form-label">
                      {t('pages.parts.inventory.modal.fields.supplier')}{' '}
                      <span className="required">*</span>
                    </label>
                    <input
                      id="edit-supplier"
                      type="text"
                      className="form-input"
                      placeholder={t('pages.parts.inventory.modal.placeholders.supplier')}
                      value={editingPart?.supplier || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEditingPart((p) => (p ? { ...p, supplier: e.target.value } : null))
                      }
                      required
                    />
                  </div>
                  <div className="inventory-form-row">
                    <div className="inventory-form-group">
                      <label htmlFor="edit-low-threshold" className="form-label">
                        {t('pages.parts.inventory.modal.fields.lowStockThreshold')}
                      </label>
                      <input
                        id="edit-low-threshold"
                        type="text"
                        inputMode="numeric"
                        className="form-input"
                        value={editingPart?.lowStockThreshold || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setEditingPart((p) =>
                            p ? { ...p, lowStockThreshold: parseInt(e.target.value) || 0 } : null
                          )
                        }
                      />
                    </div>
                    <div className="inventory-form-group">
                      <label htmlFor="edit-out-threshold" className="form-label">
                        {t('pages.parts.inventory.modal.fields.outOfStockThreshold')}
                      </label>
                      <input
                        id="edit-out-threshold"
                        type="text"
                        inputMode="numeric"
                        className="form-input"
                        value={editingPart?.outOfStockThreshold || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setEditingPart((p) =>
                            p ? { ...p, outOfStockThreshold: parseInt(e.target.value) || 0 } : null
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="inventory-form-group">
                    <label htmlFor="edit-high-threshold" className="form-label">
                      {t('pages.parts.inventory.modal.fields.highStockThreshold')}
                    </label>
                    <input
                      id="edit-high-threshold"
                      type="text"
                      inputMode="numeric"
                      className="form-input"
                      value={editingPart?.highStockThreshold || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEditingPart((p) =>
                          p ? { ...p, highStockThreshold: parseInt(e.target.value) || 0 } : null
                        )
                      }
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-cancel" onClick={() => setEditingPart(null)}>
                    {t('pages.parts.inventory.modal.buttons.cancel')}
                  </button>
                  <button type="submit" className="btn-submit">
                    {t('pages.parts.inventory.modal.buttons.updatePart')}
                  </button>
                </div>
              </form>
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
