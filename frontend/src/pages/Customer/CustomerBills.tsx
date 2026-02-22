import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, DollarSign, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getCustomerBills } from '../../features/report/api/getCustomerBills';
import { downloadBillPdf } from '../../features/report/api/downloadBillPdf';
import useAuthStore from '../../features/authentication/store/authStore';
import { sanitizeInput } from '../../utils/sanitizer';
import { formatCurrencyLocalized, formatDateLocalized } from '../../utils/localeFormat';
import type { BillResponseModel } from '../../features/report/models/BillResponseModel';
import { handlePayment } from '../../features/payment/api/handlePayment';
import './CustomerBills.css';

const ITEMS_PER_PAGE = 10;

const CustomerBills = () => {
  const { t, i18n } = useTranslation();
  const { customerData } = useAuthStore();

  const [bills, setBills] = useState<BillResponseModel[]>([]);
  const [loading, setLoading] = useState(false);

  // Pay button loading (prevents double-click + shows "Paying..." if you want)
  const [payingBillId, setPayingBillId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PAID' | 'UNPAID'>('ALL');

  const showToast = (text: string, type: 'success' | 'error') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadBills = async () => {
    if (!customerData?.customerId) return;

    setLoading(true);
    try {
      const data = await getCustomerBills(customerData.customerId);
      setBills(data);
    } catch (error) {
      showToast(t('messages.failedToLoadBills'), 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBills();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerData?.customerId]);

  const handleDownloadPdf = async (billId: string) => {
    try {
      const language = i18n.language === 'fr' ? 'fr' : 'en';
      const blob = await downloadBillPdf(billId, language);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bill_${billId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast(t('messages.billDownloadedSuccessfully'), 'success');
    } catch (error) {
      showToast(t('messages.failedToDownloadBill'), 'error');
      console.error('Download error:', error);
    }
  };

  const handlePayBill = async (billId: string) => {
    if (payingBillId) return; // avoid double click while any payment is starting
    setPayingBillId(billId);

    try {
      const locale = i18n.language === 'fr' ? 'fr' : 'en';
      const { url } = await handlePayment(billId, locale);
      window.location.href = url; // redirect to Stripe hosted checkout
    } catch (error) {
      showToast(t('messages.failedToStartPayment'), 'error');
      console.error('Stripe redirect error:', error);
      setPayingBillId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return formatDateLocalized(dateString, i18n.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getJobName = (bill: BillResponseModel): string => {
    if (i18n.language === 'fr' && bill.jobNameFr) {
      return bill.jobNameFr;
    }
    return bill.jobName;
  };

  // Filtered bills based on search and status
  const filteredBills = useMemo(() => {
    return bills.filter((bill) => {
      const searchLower = searchQuery.toLowerCase();
      const formattedAppointmentDate = formatDate(bill.appointmentDate).toLowerCase();
      const formattedCreatedDate = bill.createdAt ? formatDate(bill.createdAt).toLowerCase() : '';

      const matchesSearch =
        bill.billId.toLowerCase().includes(searchLower) ||
        bill.jobName.toLowerCase().includes(searchLower) ||
        formattedAppointmentDate.includes(searchLower) ||
        formattedCreatedDate.includes(searchLower) ||
        bill.appointmentDate.toLowerCase().includes(searchLower) ||
        (bill.createdAt && bill.createdAt.toLowerCase().includes(searchLower));

      if (filterStatus === 'ALL') return matchesSearch;
      return matchesSearch && bill.status === filterStatus;
    });
  }, [bills, searchQuery, filterStatus]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredBills.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedBills = filteredBills.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

  const formatCurrency = (value: number) => {
    return formatCurrencyLocalized(value, i18n.language, 'CAD');
  };

  const getStatusBadgeClass = (status: string) => {
    return status === 'PAID' ? 'badge-paid' : 'badge-unpaid';
  };

  const calculateTotalAmount = () => {
    return filteredBills
      .filter((bill) => bill.status === 'PAID')
      .reduce((sum, bill) => sum + bill.amount, 0);
  };

  const calculateUnpaidAmount = () => {
    return filteredBills
      .filter((bill) => bill.status === 'UNPAID')
      .reduce((sum, bill) => sum + bill.amount, 0);
  };

  return (
    <div className="customer-bills-container">
      <div className="bills-header">
        <div className="header-content">
          <h1>{t('pages.customers.bills.title')}</h1>
          <p className="subtitle">{t('pages.customers.bills.subtitle')}</p>
        </div>

        <div className="summary-cards">
          <motion.div className="summary-card" whileHover={{ translateY: -2 }}>
            <div className="card-icon">
              <DollarSign size={24} />
            </div>
            <div className="card-content">
              <div className="card-label">{t('pages.customers.bills.totalAmount')}</div>
              <div className="card-value">{formatCurrency(calculateTotalAmount())}</div>
            </div>
          </motion.div>

          <motion.div className="summary-card alert" whileHover={{ translateY: -2 }}>
            <div className="card-icon">
              <FileText size={24} />
            </div>
            <div className="card-content">
              <div className="card-label">{t('pages.customers.bills.outstandingBalance')}</div>
              <div className="card-value">{formatCurrency(calculateUnpaidAmount())}</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bills-controls">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder={t('pages.customers.bills.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(sanitizeInput(e.target.value))}
            className="search-input"
          />
        </div>

        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterStatus === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilterStatus('ALL')}
          >
            {t('pages.customers.bills.filters.all')}
          </button>
          <button
            className={`filter-btn ${filterStatus === 'UNPAID' ? 'active' : ''}`}
            onClick={() => setFilterStatus('UNPAID')}
          >
            {t('pages.customers.bills.filters.unpaid')}
          </button>
          <button
            className={`filter-btn ${filterStatus === 'PAID' ? 'active' : ''}`}
            onClick={() => setFilterStatus('PAID')}
          >
            {t('pages.customers.bills.filters.paid')}
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="loading-container">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="spinner"
          />
          <p>{t('common.loading')}</p>
        </div>
      )}

      {/* Bills Table */}
      {!loading && paginatedBills.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bills-table-container"
        >
          <table className="bills-table">
            <thead>
              <tr>
                <th>{t('pages.customers.bills.table.billId')}</th>
                <th>{t('pages.customers.bills.table.jobName')}</th>
                <th>{t('pages.customers.bills.table.appointmentDate')}</th>
                <th>{t('pages.customers.bills.table.amount')}</th>
                <th>{t('pages.customers.bills.table.status')}</th>
                <th>{t('pages.customers.bills.table.createdDate')}</th>
                <th>{t('pages.customers.bills.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {paginatedBills.map((bill) => (
                  <motion.tr
                    key={bill.billId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
                  >
                    <td className="bill-id">
                      <FileText size={16} className="icon" />
                      {bill.billId}
                    </td>
                    <td>{getJobName(bill)}</td>
                    <td>{formatDate(bill.appointmentDate)}</td>
                    <td className="amount">{formatCurrency(bill.amount)}</td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(bill.status)}`}>
                        {t(`pages.customers.bills.status.${bill.status.toLowerCase()}`)}
                      </span>
                    </td>
                    <td>{formatDate(bill.createdAt)}</td>
                    <td className="bills-actions">
                      {bill.status === 'UNPAID' && (
                        <button
                          onClick={() => handlePayBill(bill.billId)}
                          className="bill-pay-btn"
                          title={t('pages.customers.bills.actions.pay')}
                          disabled={payingBillId === bill.billId}
                        >
                          <DollarSign size={16} />
                          {payingBillId === bill.billId
                            ? t('pages.customers.bills.actions.paying')
                            : t('pages.customers.bills.actions.pay')}
                        </button>
                      )}

                      <button
                        onClick={() => handleDownloadPdf(bill.billId)}
                        className="bill-download-btn"
                        title={t('pages.customers.bills.actions.downloadPdf')}
                      >
                        <Download size={16} />
                        {t('common.download')}
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </motion.div>
      )}

      {/* Empty state */}
      {!loading && filteredBills.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="empty-state"
        >
          <FileText size={48} className="empty-icon" />
          <h3>{t('pages.customers.bills.noResults')}</h3>
          <p>
            {bills.length === 0
              ? "You don't have any bills yet. Bills will appear here once your service reports are created."
              : 'No bills match your search filters.'}
          </p>
        </motion.div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className="pagination-btn"
          >
            {t('pages.customers.bills.pagination.previous')}
          </button>
          <div className="pagination-info">
            {t('pages.customers.bills.pagination.pageInfo', {
              current: currentPage,
              total: totalPages,
              showing: paginatedBills.length,
              filtered: filteredBills.length,
            })}
          </div>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
            className="pagination-btn"
          >
            {t('pages.customers.bills.pagination.next')}
          </button>
        </div>
      )}

      {/* Toast notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`toast ${toastMessage.type}`}
          >
            {toastMessage.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomerBills;
