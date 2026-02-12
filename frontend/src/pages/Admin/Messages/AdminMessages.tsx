import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import './AdminMessages.css';
import Toast from '../../../shared/components/Toast';
import ConfirmationModal from '../../../components/ConfirmationModal';
import { sanitizeInput } from '../../../utils/sanitizer';

export interface ContactMessage {
  messageId: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  isRead: boolean;
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
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  } | null>(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    messageId: string | null;
  }>({ isOpen: false, messageId: null });

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080/api/v1';

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      let url = `${backendUrl}/contact/messages?page=${currentPage}&size=${pageSize}`;

      // Use appropriate endpoint based on filter selection
      if (selectedStatus === 'unread') {
        url = `${backendUrl}/contact/messages/unread?page=${currentPage}&size=${pageSize}`;
      } else if (selectedStatus === 'read') {
        // For read messages, fetch all and filter on frontend
        url = `${backendUrl}/contact/messages?page=${currentPage}&size=${pageSize}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data: PaginatedResponse = await response.json();

        // Additional filtering for 'read' status on frontend
        if (selectedStatus === 'read') {
          data.content = data.content.filter((msg) => msg.isRead === true);
        }

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
    fetchMessages();
  }, [fetchMessages]);

  // Handle read status toggle
  const handleReadStatusToggle = async (messageId: string, currentIsRead: boolean) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${backendUrl}/contact/messages/${messageId}/read?isRead=${!currentIsRead}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        // Update selectedMessage with new isRead status
        if (selectedMessage) {
          setSelectedMessage({
            ...selectedMessage,
            isRead: !currentIsRead,
          });
        }
        // Refresh messages list
        fetchMessages();
      } else {
        console.error('Failed to update read status');
        // Revert the change if API fails
        fetchMessages();
      }
    } catch (error) {
      console.error('Error updating read status:', error);
      // Revert the change if API fails
      fetchMessages();
    }
  };

  // Handle add admin notes
  const handleAddNotes = async () => {
    if (!selectedMessage) return;

    try {
      const token = localStorage.getItem('authToken');
      const sanitizedNotes = sanitizeInput(adminNotes);
      const response = await fetch(
        `${backendUrl}/contact/messages/${selectedMessage.messageId}/notes`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ notes: sanitizedNotes }),
        }
      );

      if (response.ok) {
        setAdminNotes('');
        setShowModal(false);
        setToast({
          message: t('pages.adminMessages.notesSavedSuccessfully'),
          type: 'success',
        });
        fetchMessages();
      }
    } catch (error) {
      console.error('Error adding notes:', error);
    }
  };

  // Handle delete message
  const handleDeleteMessage = async (messageId: string) => {
    setDeleteConfirmModal({ isOpen: true, messageId });
  };

  const confirmDeleteMessage = async () => {
    if (!deleteConfirmModal.messageId) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${backendUrl}/contact/messages/${deleteConfirmModal.messageId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        setShowModal(false);
        setToast({ message: t('pages.adminMessages.messageDeletedSuccessfully'), type: 'success' });
        fetchMessages();
      } else {
        setToast({ message: t('pages.adminMessages.deleteButton') + ' failed', type: 'error' });
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      setToast({ message: t('common.error'), type: 'error' });
    } finally {
      setDeleteConfirmModal({ isOpen: false, messageId: null });
    }
  };

  // Open message detail modal
  const handleViewMessage = async (message: ContactMessage) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${backendUrl}/contact/messages/${message.messageId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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

  return (
    <div className="admin-messages-container">
      <div className="messages-header">
        <h1>{t('pages.adminMessages.title')}</h1>
        <p>{t('pages.adminMessages.subtitle')}</p>
      </div>

      {/* Filter Section */}
      <div className="messages-filters">
        <label>{t('pages.adminMessages.showLabel')}</label>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="status-filter"
        >
          <option value="">{t('pages.adminMessages.allMessages')}</option>
          <option value="unread">{t('pages.adminMessages.unreadOnly')}</option>
          <option value="read">{t('pages.adminMessages.readOnly')}</option>
        </select>
      </div>

      {/* Messages Table */}
      <div className="messages-table-wrapper">
        {isLoading ? (
          <div className="loading">{t('pages.adminMessages.loadingMessages')}</div>
        ) : messages.length === 0 ? (
          <div className="no-messages">{t('pages.adminMessages.noMessagesFound')}</div>
        ) : (
          <table className="messages-table">
            <thead>
              <tr>
                <th>{t('pages.adminMessages.tableRead')}</th>
                <th>{t('pages.adminMessages.tableFrom')}</th>
                <th>{t('pages.adminMessages.tableEmail')}</th>
                <th>{t('pages.adminMessages.tableSubject')}</th>
                <th>{t('pages.adminMessages.tableDate')}</th>
                <th>{t('pages.adminMessages.tableAction')}</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((msg) => (
                <tr key={msg.messageId} className={`message-row ${msg.isRead ? 'read' : 'unread'}`}>
                  <td className="read-cell">
                    <button
                      className="checkmark-btn"
                      onClick={() => handleReadStatusToggle(msg.messageId, msg.isRead)}
                      title={
                        msg.isRead
                          ? t('pages.adminMessages.markAsUnread')
                          : t('pages.adminMessages.markAsRead')
                      }
                    >
                      {msg.isRead ? '✓' : '○'}
                    </button>
                  </td>
                  <td>{msg.name}</td>
                  <td>{msg.email}</td>
                  <td className="subject-cell">{msg.subject}</td>
                  <td className="date-cell">{new Date(msg.createdAt).toLocaleDateString()}</td>
                  <td className="action-cell">
                    <button className="btn-view-msg" onClick={() => handleViewMessage(msg)}>
                      {t('pages.adminMessages.viewButton')}
                    </button>
                    <button
                      className="btn-delete-msg"
                      onClick={() => handleDeleteMessage(msg.messageId)}
                      title={t('pages.adminMessages.deleteButton')}
                    >
                      {t('pages.adminMessages.deleteButton')}
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
            {t('pages.adminMessages.previousPage')}
          </button>
          <span>
            {t('pages.adminMessages.pageOf', { current: currentPage + 1, total: totalPages })}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage === totalPages - 1}
          >
            {t('pages.adminMessages.nextPage')}
          </button>
        </div>
      )}

      {/* Message Detail Modal */}
      {showModal && selectedMessage && (
        <div className="modal-overlay-msg" onClick={() => setShowModal(false)}>
          <div className="modal-msg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-msg">
              <h2>{t('pages.adminMessages.messageDetails')}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

            <div className="modal-body-msg">
              {/* Sender Info */}
              <div className="msg-section">
                <h3>{t('pages.adminMessages.modalFromLabel')}</h3>
                <p>
                  <strong>{selectedMessage.name}</strong>
                </p>
                <p className="email-text">{selectedMessage.email}</p>
                {selectedMessage.phone && (
                  <p className="phone-text">
                    {t('pages.adminMessages.modalPhoneLabel')}: {selectedMessage.phone}
                  </p>
                )}
              </div>

              {/* Subject and Message */}
              <div className="msg-section">
                <h3>{t('pages.adminMessages.modalSubjectLabel')}</h3>
                <p className="subject-text">{selectedMessage.subject}</p>
              </div>

              <div className="msg-section">
                <h3>{t('pages.adminMessages.modalMessageLabel')}</h3>
                <div className="message-content">{selectedMessage.message}</div>
              </div>

              {/* Read Status */}
              <div className="msg-section">
                <h3>{t('pages.adminMessages.modalMarkAsReadLabel')}</h3>
                <div className="read-status-update">
                  <button
                    className={`toggle-read-btn ${selectedMessage.isRead ? 'read' : 'unread'}`}
                    onClick={() =>
                      handleReadStatusToggle(selectedMessage.messageId, selectedMessage.isRead)
                    }
                  >
                    {selectedMessage.isRead
                      ? t('pages.adminMessages.markAsUnreadBtn')
                      : t('pages.adminMessages.markAsReadBtn')}
                  </button>
                </div>
              </div>

              {/* Admin Notes */}
              <div className="msg-section">
                <h3>{t('pages.adminMessages.adminNotesLabel')}</h3>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(sanitizeInput(e.target.value))}
                  placeholder={t('pages.adminMessages.adminNotesPlaceholder')}
                  className="admin-notes-textarea"
                  rows={4}
                />
              </div>

              {/* Metadata */}
              <div className="msg-section msg-metadata">
                <p>
                  <strong>{t('pages.adminMessages.receivedLabel')}:</strong>{' '}
                  {new Date(selectedMessage.createdAt).toLocaleString()}
                </p>
                {selectedMessage.respondedAt && (
                  <p>
                    <strong>{t('pages.adminMessages.respondedLabel')}:</strong>{' '}
                    {new Date(selectedMessage.respondedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer-msg">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>
                {t('pages.adminMessages.closeButton')}
              </button>
              <button
                className="btn-delete"
                onClick={() => selectedMessage && handleDeleteMessage(selectedMessage.messageId)}
              >
                {t('pages.adminMessages.deleteButton')}
              </button>
              <button className="btn-save" onClick={handleAddNotes}>
                {t('pages.adminMessages.saveNotesButton')}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <ConfirmationModal
        isOpen={deleteConfirmModal.isOpen}
        title={t('pages.adminMessages.deleteButton')}
        message={t('pages.adminMessages.confirmDelete')}
        confirmText={t('pages.adminMessages.deleteButton')}
        cancelText={t('common.cancel')}
        isDanger
        onConfirm={confirmDeleteMessage}
        onCancel={() => setDeleteConfirmModal({ isOpen: false, messageId: null })}
      />
    </div>
  );
}
