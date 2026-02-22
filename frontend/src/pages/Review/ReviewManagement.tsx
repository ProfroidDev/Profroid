import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t, i18n } = useTranslation();
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
        message: t('pages.reviews.messages.loadFailed'),
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
        message: t('pages.reviews.messages.approveSuccess'),
        type: 'success',
      });
      fetchReviews();
    } catch (error) {
      console.error('Failed to approve review:', error);
      setToast({
        message: t('pages.reviews.messages.approveFailed'),
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
        message: t('pages.reviews.messages.rejectSuccess'),
        type: 'success',
      });
      fetchReviews();
    } catch (error) {
      console.error('Failed to reject review:', error);
      setToast({
        message: t('pages.reviews.messages.rejectFailed'),
        type: 'error',
      });
    }
  }

  async function handleDelete(reviewId: string) {
    setConfirmModal({
      isOpen: true,
      title: t('pages.reviews.messages.deleteConfirmTitle'),
      message: t('pages.reviews.messages.deleteConfirmMessage'),
      onConfirm: async () => {
        try {
          await deleteReview(reviewId);
          setToast({
            message: t('pages.reviews.messages.deleteSuccess'),
            type: 'success',
          });
          fetchReviews();
        } catch (error) {
          console.error('Failed to delete review:', error);
          setToast({
            message: t('pages.reviews.messages.deleteFailed'),
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
            {t('pages.reviews.statusBadges.pending')}
          </span>
        );
      case 'APPROVED':
        return (
          <span className="status-badge status-approved">
            <CheckCircle size={14} />
            {t('pages.reviews.statusBadges.approved')}
          </span>
        );
      case 'REJECTED':
        return (
          <span className="status-badge status-rejected">
            <XCircle size={14} />
            {t('pages.reviews.statusBadges.rejected')}
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.resolvedLanguage || i18n.language || 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="review-management-page" aria-labelledby="reviews-page-title">
      <div className="review-management-header">
        <h1 id="reviews-page-title" className="page-title">
          {t('pages.reviews.title')}
        </h1>
        <p className="page-subtitle">{t('pages.reviews.subtitle')}</p>
      </div>

      <div className="review-filters" role="group" aria-label={t('pages.reviews.title')}>
        <button
          type="button"
          className={`filter-btn ${filter === 'ALL' ? 'active' : ''}`}
          onClick={() => setFilter('ALL')}
        >
          {t('pages.reviews.filters.all')} ({reviews.length})
        </button>
        <button
          type="button"
          className={`filter-btn ${filter === 'PENDING' ? 'active' : ''}`}
          onClick={() => setFilter('PENDING')}
        >
          {t('pages.reviews.filters.pending')} (
          {reviews.filter((r) => r.status === 'PENDING').length})
        </button>
        <button
          type="button"
          className={`filter-btn ${filter === 'APPROVED' ? 'active' : ''}`}
          onClick={() => setFilter('APPROVED')}
        >
          {t('pages.reviews.filters.approved')} (
          {reviews.filter((r) => r.status === 'APPROVED').length})
        </button>
        <button
          type="button"
          className={`filter-btn ${filter === 'REJECTED' ? 'active' : ''}`}
          onClick={() => setFilter('REJECTED')}
        >
          {t('pages.reviews.filters.rejected')} (
          {reviews.filter((r) => r.status === 'REJECTED').length})
        </button>
      </div>

      {loading ? (
        <div className="loading-container" role="status" aria-live="polite">
          <div className="loading-spinner" aria-hidden="true"></div>
          <p>{t('pages.reviews.labels.loading')}</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="empty-state" role="status" aria-live="polite">
          <p>{t('pages.reviews.labels.noReviews')}</p>
        </div>
      ) : (
        <div className="reviews-grid">
          {filteredReviews.map((review) => (
            <article
              key={review.reviewId}
              className="review-card"
              aria-labelledby={`review-title-${review.reviewId}`}
            >
              <div className="review-card-header">
                <div id={`review-title-${review.reviewId}`} className="review-id">
                  <strong>{t('pages.reviews.labels.id')}:</strong> {review.reviewId}
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
                    aria-hidden="true"
                    focusable="false"
                  />
                ))}
                <span className="sr-only">{`Rating: ${review.rating} out of 5`}</span>
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
                  <strong>{t('pages.reviews.labels.submitted')}:</strong>{' '}
                  {formatDate(review.createdAt)}
                </div>
                {review.reviewedAt && (
                  <div className="meta-item">
                    <strong>{t('pages.reviews.labels.reviewed')}:</strong>{' '}
                    {formatDate(review.reviewedAt)}
                  </div>
                )}
              </div>

              <div className="review-actions">
                {review.status === 'PENDING' && (
                  <>
                    <button
                      type="button"
                      className="action-btn approve-btn"
                      onClick={() => handleApprove(review.reviewId)}
                    >
                      <Check size={16} />
                      {t('pages.reviews.actions.approve')}
                    </button>
                    <button
                      type="button"
                      className="action-btn reject-btn"
                      onClick={() => handleReject(review.reviewId)}
                    >
                      <X size={16} />
                      {t('pages.reviews.actions.reject')}
                    </button>
                  </>
                )}
                {review.status === 'APPROVED' && (
                  <button
                    type="button"
                    className="action-btn reject-btn"
                    onClick={() => handleReject(review.reviewId)}
                  >
                    <X size={16} />
                    {t('pages.reviews.actions.revokeApproval')}
                  </button>
                )}
                {review.status === 'REJECTED' && (
                  <button
                    type="button"
                    className="action-btn approve-btn"
                    onClick={() => handleApprove(review.reviewId)}
                  >
                    <Check size={16} />
                    {t('pages.reviews.actions.approve')}
                  </button>
                )}
                <button
                  type="button"
                  className="action-btn delete-btn"
                  onClick={() => handleDelete(review.reviewId)}
                >
                  <Trash2 size={16} />
                  {t('pages.reviews.actions.delete')}
                </button>
              </div>
            </article>
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
