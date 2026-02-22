import React, { useState } from 'react';
import { Star, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { createReview } from '../../../features/review/api/createReview';
import useAuthStore from '../../../features/authentication/store/authStore';
import { sanitizeName, sanitizeInput } from '../../../utils/sanitizer';
import { trimToMaxWords } from '../../../utils/wordLimit';
import '../HomePage.css';
import './FeedbackSection.css';

const FeedbackSection: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const FEEDBACK_MAX_WORDS = 80;
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || !customerName.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      await createReview({
        rating,
        comment: feedback.trim() || undefined,
        customerName: customerName.trim(),
        customerId: user?.id || undefined,
      });

      setSubmitted(true);

      // Reset after showing success message
      setTimeout(() => {
        setSubmitted(false);
        setRating(0);
        setFeedback('');
        setCustomerName('');
      }, 5000);
    } catch (err: unknown) {
      console.error('Failed to submit review:', err);

      // Check if error is from profanity filter
      const error = err as { response?: { status?: number; data?: { message?: string } } };
      if (error.response?.status === 400 && error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Failed to submit your review. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="section-container feedback-section">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="section-title">{t('pages.home.feedback.title')}</h2>
        <p className="section-subtitle">{t('pages.home.feedback.subtitle')}</p>
      </motion.div>

      <motion.div
        className="feedback-card"
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              className="success-message"
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <div className="success-icon">✓</div>
              <h3>{t('pages.home.feedback.success.title')}</h3>
              <p>{t('pages.home.feedback.success.message')}</p>
            </motion.div>
          ) : (
            <motion.form
              onSubmit={handleSubmit}
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {error && (
                <div
                  style={{
                    color: '#991b1b',
                    marginBottom: '15px',
                    padding: '10px',
                    backgroundColor: '#fef2f2',
                    borderRadius: '6px',
                    textAlign: 'center',
                  }}
                >
                  {error}
                </div>
              )}

              <div className="feedback-input-group">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}
                >
                  <label style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                    {t('pages.home.feedback.namePlaceholder') || 'Your Name'}
                  </label>
                  <span style={{ fontSize: '0.85rem', color: '#666' }}>
                    {customerName.length}/100
                  </span>
                </div>
                <input
                  type="text"
                  className="feedback-textarea"
                  placeholder={t('pages.home.feedback.namePlaceholder') || 'Your Name'}
                  value={customerName}
                  onChange={(e) => setCustomerName(sanitizeName(e.target.value))}
                  maxLength={100}
                  required
                  style={{ height: '45px' }}
                />
              </div>

              <div className="rating-container">
                <p className="rating-label">{t('pages.home.feedback.rateLabel')}</p>
                <div className="stars-input">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <motion.button
                      key={star}
                      type="button"
                      className="star-btn"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Star
                        size={32}
                        fill={star <= (hoverRating || rating) ? '#eebb4d' : 'none'}
                        color={star <= (hoverRating || rating) ? '#eebb4d' : '#ccc'}
                      />
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="feedback-input-group">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}
                >
                  <label>{t('pages.home.feedback.placeholder')}</label>
                  <span style={{ fontSize: '0.85rem', color: '#666' }}>{feedback.length}/2000</span>
                </div>
                <textarea
                  className="feedback-textarea"
                  placeholder={t('pages.home.feedback.placeholder')}
                  value={feedback}
                  onChange={(e) =>
                    setFeedback(trimToMaxWords(sanitizeInput(e.target.value), FEEDBACK_MAX_WORDS))
                  }
                  maxLength={2000}
                  rows={4}
                />
              </div>

              <motion.button
                type="submit"
                className="submit-btn"
                disabled={rating === 0 || !customerName.trim() || submitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {submitting ? t('common.loading') : t('pages.home.feedback.submitButton')}
                {!submitting && <Send size={18} style={{ marginLeft: 8 }} />}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  );
};

export default FeedbackSection;
