import { useState, useEffect, useCallback } from 'react';
import { Mail, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import './AdminMessages.css';

export interface ContactMessage {
  messageId: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'UNREAD' | 'READ' | 'IN_PROGRESS' | 'RESOLVED' | 'ARCHIVED';
  adminNotes?: string;
  respondedBy?: string;
  createdAt: string;
  updatedAt: string;
  respondedAt?: string;
}

interface PaginatedResponse {
  content: ContactMessage[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export default function AdminMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [showModal, setShowModal] = useState(false);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080/api/v1';

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      let url = `${backendUrl}/contact/messages?page=${currentPage}&size=${pageSize}`;

      if (selectedStatus) {
        url = `${backendUrl}/contact/messages/status/${selectedStatus}?page=${currentPage}&size=${pageSize}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data: PaginatedResponse = await response.json();
        setMessages(data.content);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, selectedStatus, backendUrl]);

  useEffect(() => {
    setCurrentPage(0);
  }, [selectedStatus]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Handle status update
  const handleStatusUpdate = async (messageId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${backendUrl}/contact/messages/${messageId}/status?status=${newStatus}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        fetchMessages();
      }
    } catch (error) {
      console.error('Error updating message status:', error);
    }
  };

  // Handle add admin notes
  const handleAddNotes = async () => {
    if (!selectedMessage) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${backendUrl}/contact/messages/${selectedMessage.messageId}/notes`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ notes: adminNotes }),
        }
      );

      if (response.ok) {
        setAdminNotes('');
        setShowModal(false);
        fetchMessages();
      }
    } catch (error) {
      console.error('Error adding notes:', error);
    }
  };

  // Open message detail modal
  const handleViewMessage = async (message: ContactMessage) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${backendUrl}/contact/messages/${message.messageId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const updatedMessage = await response.json();
        setSelectedMessage(updatedMessage);
        setAdminNotes(updatedMessage.adminNotes || '');
        setShowModal(true);
      }
    } catch (error) {
      console.error('Error fetching message details:', error);
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UNREAD':
        return 'status-unread';
      case 'READ':
        return 'status-read';
      case 'IN_PROGRESS':
        return 'status-in-progress';
      case 'RESOLVED':
        return 'status-resolved';
      case 'ARCHIVED':
        return 'status-archived';
      default:
        return 'status-read';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'UNREAD':
        return <Mail size={16} />;
      case 'READ':
        return <Clock size={16} />;
      case 'IN_PROGRESS':
        return <AlertCircle size={16} />;
      case 'RESOLVED':
        return <CheckCircle size={16} />;
      default:
        return null;
    }
  };

  return (
    <div className="admin-messages-container">
      <div className="messages-header">
        <h1>Contact Messages</h1>
        <p>Manage and respond to contact form submissions</p>
      </div>

      {/* Filter Section */}
      <div className="messages-filters">
        <label>Filter by Status:</label>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="status-filter"
        >
          <option value="">All Messages</option>
          <option value="UNREAD">Unread</option>
          <option value="READ">Read</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      {/* Messages Table */}
      <div className="messages-table-wrapper">
        {isLoading ? (
          <div className="loading">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="no-messages">No messages found</div>
        ) : (
          <table className="messages-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>From</th>
                <th>Email</th>
                <th>Subject</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((msg) => (
                <tr key={msg.messageId} className={`message-row ${getStatusColor(msg.status)}`}>
                  <td className="status-cell">
                    <span className={`status-badge ${getStatusColor(msg.status)}`}>
                      {getStatusIcon(msg.status)}
                      {msg.status}
                    </span>
                  </td>
                  <td>{msg.name}</td>
                  <td>{msg.email}</td>
                  <td className="subject-cell">{msg.subject}</td>
                  <td className="date-cell">
                    {new Date(msg.createdAt).toLocaleDateString()}
                  </td>
                  <td className="action-cell">
                    <button
                      className="btn-view-msg"
                      onClick={() => handleViewMessage(msg)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
          >
            Previous
          </button>
          <span>
            Page {currentPage + 1} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage === totalPages - 1}
          >
            Next
          </button>
        </div>
      )}

      {/* Message Detail Modal */}
      {showModal && selectedMessage && (
        <div className="modal-overlay-msg" onClick={() => setShowModal(false)}>
          <div className="modal-msg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-msg">
              <h2>Message Details</h2>
              <button
                className="close-btn"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body-msg">
              {/* Sender Info */}
              <div className="msg-section">
                <h3>From</h3>
                <p>
                  <strong>{selectedMessage.name}</strong>
                </p>
                <p className="email-text">{selectedMessage.email}</p>
                {selectedMessage.phone && (
                  <p className="phone-text">Phone: {selectedMessage.phone}</p>
                )}
              </div>

              {/* Subject and Message */}
              <div className="msg-section">
                <h3>Subject</h3>
                <p className="subject-text">{selectedMessage.subject}</p>
              </div>

              <div className="msg-section">
                <h3>Message</h3>
                <div className="message-content">
                  {selectedMessage.message}
                </div>
              </div>

              {/* Status Update */}
              <div className="msg-section">
                <h3>Current Status</h3>
                <div className="status-update">
                  <span className={`status-badge ${getStatusColor(selectedMessage.status)}`}>
                    {selectedMessage.status}
                  </span>
                  <select
                    value={selectedMessage.status}
                    onChange={(e) => {
                      handleStatusUpdate(selectedMessage.messageId, e.target.value);
                      setSelectedMessage({
                        ...selectedMessage,
                        status: e.target.value as 'UNREAD' | 'READ' | 'IN_PROGRESS' | 'RESOLVED' | 'ARCHIVED',
                      });
                    }}
                    className="status-select"
                  >
                    <option value="UNREAD">Unread</option>
                    <option value="READ">Read</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
              </div>

              {/* Admin Notes */}
              <div className="msg-section">
                <h3>Admin Notes</h3>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add your response or notes here..."
                  className="admin-notes-textarea"
                  rows={4}
                />
              </div>

              {/* Metadata */}
              <div className="msg-section msg-metadata">
                <p>
                  <strong>Received:</strong>{' '}
                  {new Date(selectedMessage.createdAt).toLocaleString()}
                </p>
                {selectedMessage.respondedAt && (
                  <p>
                    <strong>Responded:</strong>{' '}
                    {new Date(selectedMessage.respondedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer-msg">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>
                Close
              </button>
              <button className="btn-save" onClick={handleAddNotes}>
                Save Notes & Update Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
