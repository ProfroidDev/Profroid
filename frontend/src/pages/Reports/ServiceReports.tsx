import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Eye, Edit2, FileText } from "lucide-react";
import { getAllReports } from "../../features/report/api/getAllReports";
import ViewReportModal from "../../features/report/components/ViewReportModal";
import ReportFormModal from "../../features/report/components/ReportFormModal";
import type { ReportResponseModel } from "../../features/report/models/ReportResponseModel";
import type { AppointmentResponseModel } from "../../features/appointment/models/AppointmentResponseModel";
import "./ServiceReports.css";

const ITEMS_PER_PAGE = 15;

const ServiceReports = () => {
  const [reports, setReports] = useState<ReportResponseModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  
  // Modal states
  const [viewingReport, setViewingReport] = useState<ReportResponseModel | null>(null);
  const [editingReport, setEditingReport] = useState<ReportResponseModel | null>(null);

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await getAllReports();
      setReports(data);
    } catch (error) {
      showToast("Failed to load reports", "error");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch reports on mount
  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (text: string, type: "success" | "error") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const customerName = `${report.customerFirstName} ${report.customerLastName}`.toLowerCase();
      const technicianName = `${report.technicianFirstName} ${report.technicianLastName}`.toLowerCase();
      const searchLower = searchQuery.toLowerCase();
      
      return (
        customerName.includes(searchLower) ||
        technicianName.includes(searchLower) ||
        report.jobName.toLowerCase().includes(searchLower)
      );
    });
  }, [reports, searchQuery]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredReports.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedReports = filteredReports.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Convert report to appointment format for editing
  const convertToAppointment = (report: ReportResponseModel): AppointmentResponseModel => {
    return {
      appointmentId: report.appointmentId,
      appointmentDate: report.appointmentDate,
      status: "COMPLETED", // Assuming completed since report exists
      customerId: report.customerId,
      customerFirstName: report.customerFirstName,
      customerLastName: report.customerLastName,
      customerPhoneNumbers: report.customerPhone 
        ? [{ type: "MOBILE", number: report.customerPhone }] 
        : [],
      technicianId: report.technicianId,
      technicianFirstName: report.technicianFirstName,
      technicianLastName: report.technicianLastName,
      jobName: report.jobName,
      jobType: "", // Not available in report
      hourlyRate: report.hourlyRate,
      cellarName: "", // Not available in report
      description: "", // Not available in report
      appointmentAddress: {
        streetAddress: "",
        city: "",
        province: "",
        postalCode: "",
        country: "",
      },
    };
  };

  const handleEditReport = (report: ReportResponseModel) => {
    setEditingReport(report);
  };

  const handleEditSuccess = (message: string) => {
    showToast(message, "success");
    setEditingReport(null);
    loadReports();
  };

  const handleEditError = (message: string) => {
    showToast(message, "error");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "status-completed";
      case "SCHEDULED":
        return "status-scheduled";
      case "CANCELLED":
        return "status-cancelled";
      default:
        return "";
    }
  };

  return (
    <div className="service-reports-page">
      {/* Main Content */}
      <main className="container main-content">
        {/* Title */}
        <div className="page-header">
          <div className="page-title-section">
            <h1 className="page-title">
              <FileText className="title-icon" />
              Reports
            </h1>
            <p className="page-subtitle">View and manage all service reports</p>
          </div>
        </div>

        {/* Filters + Search */}
        <div className="filter-bar-reports">
          <div className="search-box-reports">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by customer name, technician, or service..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Table */}
        <div className="table-container">
          <table className="reports-table">
            <thead>
              <tr>
                <th>Report ID</th>
                <th>Customer</th>
                <th>Service</th>
                <th>Technician</th>
                <th>Date</th>
                <th>Status</th>
                <th className="text-right">Total</th>
                <th className="actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="empty-state">
                    Loading reports...
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-state">
                    No reports found. Try adjusting your search.
                  </td>
                </tr>
              ) : (
                paginatedReports.map((report, index) => (
                  <motion.tr
                    key={report.reportId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <td className="report-id">{report.reportId.substring(0, 8)}</td>
                    <td className="customer-name">
                      {report.customerFirstName} {report.customerLastName}
                    </td>
                    <td>{report.jobName}</td>
                    <td className="technician-name">
                      {report.technicianFirstName} {report.technicianLastName}
                    </td>
                    <td>{formatDate(report.appointmentDate)}</td>
                    <td className="status-col">
                      <span className={`status-badge ${getStatusColor(report.appointmentStatus)}`}>
                        {report.appointmentStatus}
                      </span>
                    </td>
                    <td className="text-right price-col">{formatCurrency(report.total)}</td>
                    <td className="actions-col">
                      <motion.button
                        className="icon-btn"
                        onClick={() => setViewingReport(report)}
                        title="View Details"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Eye size={16} />
                      </motion.button>
                      <motion.button
                        className="icon-btn"
                        onClick={() => handleEditReport(report)}
                        title="Edit Report"
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
          <span>Total Reports: {filteredReports.length}</span>
        </div>

        {/* Pagination Controls */}
        {filteredReports.length > 0 && (
          <>
            <div className="reports-pagination">
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
              Page {currentPage} of {totalPages} • Showing {paginatedReports.length} of {filteredReports.length} reports
            </div>
          </>
        )}
      </main>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            className={`toast toast-${toastMessage.type}`}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
          >
            {toastMessage.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Report Modal */}
      {viewingReport && (
        <ViewReportModal
          isOpen={!!viewingReport}
          onClose={() => setViewingReport(null)}
          report={viewingReport}
        />
      )}

      {/* Edit Report Modal */}
      {editingReport && (
        <ReportFormModal
          isOpen={!!editingReport}
          onClose={() => setEditingReport(null)}
          appointment={convertToAppointment(editingReport)}
          existingReport={editingReport}
          onSuccess={handleEditSuccess}
          onError={handleEditError}
        />
      )}
    </div>
  );
};

export default ServiceReports;
