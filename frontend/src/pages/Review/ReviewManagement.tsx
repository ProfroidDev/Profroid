import React, { useEffect, useState } from 'react';
import { Star, Check, X, Trash2, Clock, CheckCircle, XCircle } from 'lucide-react';
import { getAllReviews } from '../../features/review/api/getAllReviews';
import { updateReviewStatus } from '../../features/review/api/updateReviewStatus';
import { deleteReview } from '../../features/review/api/deleteReview';
import type { ReviewResponseModel } from '../../features/review/models/ReviewModels';
import Toast from '../../shared/components/Toast';
import ConfirmationModal from '../../components/ConfirmationModal';
import useAuthStore from '../../features/authentication/store/authStore';
import './ReviewManagement.css';

export default function ReviewManagement(): React.ReactElement {
  const { user } = useAuthStore();
  const [reviews, setReviews] = useState<ReviewResponseModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  async function fetchReviews() {
    setLoading(true);
    try {
      const data = await getAllReviews();
      setReviews(data);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      setToast({
        message: 'Failed to load reviews',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(reviewId: string) {
    try {
      await updateReviewStatus(reviewId, {
        status: 'APPROVED',
        reviewedBy: user?.id,
      });
      setToast({
        message: 'Review approved successfully',
        type: 'success',
      });
      fetchReviews();
    } catch (error) {
      console.error('Failed to approve review:', error);
      setToast({
        message: 'Failed to approve review',
        type: 'error',
      });
    }
  }

  async function handleReject(reviewId: string) {
    try {
      await updateReviewStatus(reviewId, {
        status: 'REJECTED',
        reviewedBy: user?.id,
      });
      setToast({
        message: 'Review rejected successfully',
        type: 'success',
      });
      fetchReviews();
    } catch (error) {
      console.error('Failed to reject review:', error);
      setToast({
        message: 'Failed to reject review',
        type: 'error',
      });
    }
  }

  async function handleDelete(reviewId: string) {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Review',
      message:
        'Are you sure you want to permanently delete this review? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await deleteReview(reviewId);
          setToast({
            message: 'Review deleted successfully',
            type: 'success',
          });
          fetchReviews();
        } catch (error) {
          console.error('Failed to delete review:', error);
          setToast({
            message: 'Failed to delete review',
            type: 'error',
          });
        } finally {
          setConfirmModal(null);
        }
      },
    });
  }

  const filteredReviews = reviews.filter((review) => {
    if (filter === 'ALL') return true;
    return review.status === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="status-badge status-pending">
            <Clock size={14} />
            Pending
          </span>
        );
      case 'APPROVED':
        return (
          <span className="status-badge status-approved">
            <CheckCircle size={14} />
            Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="status-badge status-rejected">
            <XCircle size={14} />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="review-management-page">
      <div className="review-management-header">
        <h1 className="page-title">Review Management</h1>
        <p className="page-subtitle">Manage customer reviews and testimonials</p>
      </div>

      <div className="review-filters">
        <button
          className={`filter-btn ${filter === 'ALL' ? 'active' : ''}`}
          onClick={() => setFilter('ALL')}
        >
          All ({reviews.length})
        </button>
        <button
          className={`filter-btn ${filter === 'PENDING' ? 'active' : ''}`}
          onClick={() => setFilter('PENDING')}
        >
          Pending ({reviews.filter((r) => r.status === 'PENDING').length})
        </button>
        <button
          className={`filter-btn ${filter === 'APPROVED' ? 'active' : ''}`}
          onClick={() => setFilter('APPROVED')}
        >
          Approved ({reviews.filter((r) => r.status === 'APPROVED').length})
        </button>
        <button
          className={`filter-btn ${filter === 'REJECTED' ? 'active' : ''}`}
          onClick={() => setFilter('REJECTED')}
        >
          Rejected ({reviews.filter((r) => r.status === 'REJECTED').length})
        </button>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading reviews...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="empty-state">
          <p>No reviews found</p>
        </div>
      ) : (
        <div className="reviews-grid">
          {filteredReviews.map((review) => (
            <div key={review.reviewId} className="review-card">
              <div className="review-card-header">
                <div className="review-id">
                  <strong>ID:</strong> {review.reviewId}
                </div>
                {getStatusBadge(review.status)}
              </div>

              <div className="review-rating">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={20}
                    fill={i < review.rating ? '#eebb4d' : 'none'}
                    color={i < review.rating ? '#eebb4d' : '#ddd'}
                  />
                ))}
                <span className="rating-text">({review.rating}/5)</span>
              </div>

              <div className="review-content">
                <div className="customer-name">
                  <strong>{review.customerName}</strong>
                </div>
                {review.comment && <p className="review-comment">"{review.comment}"</p>}
              </div>

              <div className="review-meta">
                <div className="meta-item">
                  <strong>Submitted:</strong> {formatDate(review.createdAt)}
                </div>
                {review.reviewedAt && (
                  <div className="meta-item">
                    <strong>Reviewed:</strong> {formatDate(review.reviewedAt)}
                  </div>
                )}
              </div>

              <div className="review-actions">
                {review.status === 'PENDING' && (
                  <>
                    <button
                      className="action-btn approve-btn"
                      onClick={() => handleApprove(review.reviewId)}
                    >
                      <Check size={16} />
                      Approve
                    </button>
                    <button
                      className="action-btn reject-btn"
                      onClick={() => handleReject(review.reviewId)}
                    >
                      <X size={16} />
                      Reject
                    </button>
                  </>
                )}
                {review.status === 'APPROVED' && (
                  <button
                    className="action-btn reject-btn"
                    onClick={() => handleReject(review.reviewId)}
                  >
                    <X size={16} />
                    Revoke Approval
                  </button>
                )}
                {review.status === 'REJECTED' && (
                  <button
                    className="action-btn approve-btn"
                    onClick={() => handleApprove(review.reviewId)}
                  >
                    <Check size={16} />
                    Approve
                  </button>
                )}
                <button
                  className="action-btn delete-btn"
                  onClick={() => handleDelete(review.reviewId)}
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {confirmModal && (
        <ConfirmationModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
}
