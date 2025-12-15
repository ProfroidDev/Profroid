import React, { useState } from "react";
import { Star, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import "../HomePage.css";
import "./FeedbackSection.css";

const FeedbackSection: React.FC = () => {
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    // Simulate API call
    console.log({ rating, feedback });
    setSubmitted(true);

    // Reset after showing success message
    setTimeout(() => {
      setSubmitted(false);
      setRating(0);
      setFeedback("");
    }, 5000);
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
        <p className="section-subtitle">
          {t('pages.home.feedback.subtitle')}
        </p>
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
                        fill={
                          star <= (hoverRating || rating) ? "#eebb4d" : "none"
                        }
                        color={
                          star <= (hoverRating || rating) ? "#eebb4d" : "#ccc"
                        }
                      />
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="feedback-input-group">
                <textarea
                  className="feedback-textarea"
                  placeholder={t('pages.home.feedback.placeholder')}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                />
              </div>

              <motion.button
                type="submit"
                className="submit-btn"
                disabled={rating === 0}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {t('pages.home.feedback.submitButton')} <Send size={18} style={{ marginLeft: 8 }} />
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  );
};

export default FeedbackSection;
