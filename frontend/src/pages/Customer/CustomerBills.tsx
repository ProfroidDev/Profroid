import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, FileText, DollarSign } from "lucide-react";
import { getCustomerBills } from "../../features/report/api/getCustomerBills";
import useAuthStore from "../../features/authentication/store/authStore";
import type { BillResponseModel } from "../../features/report/models/BillResponseModel";
import "./CustomerBills.css";

const ITEMS_PER_PAGE = 10;

const CustomerBills = () => {
  const { customerData } = useAuthStore();
  const [bills, setBills] = useState<BillResponseModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PAID" | "UNPAID">("ALL");

  const loadBills = async () => {
    if (!customerData?.customerId) return;
    
    setLoading(true);
    try {
      const data = await getCustomerBills(customerData.customerId);
      setBills(data);
    } catch (error) {
      showToast("Failed to load bills", "error");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBills();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerData?.customerId]);

  const showToast = (text: string, type: "success" | "error") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtered bills based on search and status
  const filteredBills = useMemo(() => {
    return bills.filter((bill) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        bill.billId.toLowerCase().includes(searchLower) ||
        bill.jobName.toLowerCase().includes(searchLower) ||
        bill.appointmentDate.includes(searchQuery);

      if (filterStatus === "ALL") {
        return matchesSearch;
      }
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
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadgeClass = (status: string) => {
    return status === "PAID" ? "badge-paid" : "badge-unpaid";
  };

  const calculateTotalAmount = () => {
    return filteredBills.reduce((sum, bill) => sum + bill.amount, 0);
  };

  const calculateUnpaidAmount = () => {
    return filteredBills
      .filter((bill) => bill.status === "UNPAID")
      .reduce((sum, bill) => sum + bill.amount, 0);
  };

  return (
    <div className="customer-bills-container">
      <div className="bills-header">
        <div className="header-content">
          <h1>My Bills</h1>
          <p className="subtitle">View and manage your service bills</p>
        </div>

        <div className="summary-cards">
          <motion.div className="summary-card" whileHover={{ translateY: -2 }}>
            <div className="card-icon">
              <DollarSign size={24} />
            </div>
            <div className="card-content">
              <div className="card-label">Total Amount</div>
              <div className="card-value">{formatCurrency(calculateTotalAmount())}</div>
            </div>
          </motion.div>

          <motion.div className="summary-card alert" whileHover={{ translateY: -2 }}>
            <div className="card-icon">
              <FileText size={24} />
            </div>
            <div className="card-content">
              <div className="card-label">Outstanding Balance</div>
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
            placeholder="Search by bill ID, job name, or date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterStatus === "ALL" ? "active" : ""}`}
            onClick={() => setFilterStatus("ALL")}
          >
            All Bills
          </button>
          <button
            className={`filter-btn ${filterStatus === "UNPAID" ? "active" : ""}`}
            onClick={() => setFilterStatus("UNPAID")}
          >
            Unpaid
          </button>
          <button
            className={`filter-btn ${filterStatus === "PAID" ? "active" : ""}`}
            onClick={() => setFilterStatus("PAID")}
          >
            Paid
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="loading-container">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="spinner"
          />
          <p>Loading bills...</p>
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
                <th>Bill ID</th>
                <th>Job Name</th>
                <th>Appointment Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Created Date</th>
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
                    whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.05)" }}
                  >
                    <td className="bill-id">
                      <FileText size={16} className="icon" />
                      {bill.billId}
                    </td>
                    <td>{bill.jobName}</td>
                    <td>{formatDate(bill.appointmentDate)}</td>
                    <td className="amount">{formatCurrency(bill.amount)}</td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(bill.status)}`}>
                        {bill.status}
                      </span>
                    </td>
                    <td>{formatDate(bill.createdAt)}</td>
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
          <h3>No bills found</h3>
          <p>
            {bills.length === 0
              ? "You don't have any bills yet. Bills will appear here once your service reports are created."
              : "No bills match your search filters."}
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
            Previous
          </button>
          <div className="pagination-info">
            Page {currentPage} of {totalPages}
          </div>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
            className="pagination-btn"
          >
            Next
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
