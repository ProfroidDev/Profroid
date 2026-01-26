import React, { useEffect, useState } from 'react';
import { Star, Quote } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { getApprovedReviews } from '../../../features/review/api/getApprovedReviews';
import type { ReviewResponseModel } from '../../../features/review/models/ReviewModels';
import '../HomePage.css';
import './TestimonialsSection.css';

const TestimonialsSection: React.FC = () => {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState<ReviewResponseModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const approvedReviews = await getApprovedReviews();
        setReviews(approvedReviews);
      } catch (error) {
        console.error('Failed to fetch approved reviews:', error);
        // Fallback to hardcoded testimonials if API fails
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  // Fallback testimonials from translations - ONLY if no approved reviews
  const fallbackTestimonials = [
    {
      id: 1,
      name: t('pages.home.testimonials.reviews.review1.name'),
      location: t('pages.home.testimonials.reviews.review1.location'),
      rating: 5,
      text: t('pages.home.testimonials.reviews.review1.text'),
    },
    {
      id: 2,
      name: t('pages.home.testimonials.reviews.review2.name'),
      location: t('pages.home.testimonials.reviews.review2.location'),
      rating: 5,
      text: t('pages.home.testimonials.reviews.review2.text'),
    },
    {
      id: 3,
      name: t('pages.home.testimonials.reviews.review3.name'),
      location: t('pages.home.testimonials.reviews.review3.location'),
      rating: 4,
      text: t('pages.home.testimonials.reviews.review3.text'),
    },
  ];

  // IMPORTANT: Use ONLY approved reviews from backend
  // If no approved reviews exist, show fallback testimonials
  let displayTestimonials;

  if (reviews.length > 0) {
    // We have approved reviews - use ONLY these (replace hardcoded ones)
    displayTestimonials = reviews.map((review) => ({
      id: review.reviewId,
      name: review.customerName,
      location: '', // We don't have location in reviews
      rating: review.rating,
      text: review.comment || 'Great service!',
    }));
  } else {
    // No approved reviews yet - use fallback testimonials
    displayTestimonials = fallbackTestimonials;
  }

  // Duplicate testimonials to create a seamless loop
  const allTestimonials = [
    ...displayTestimonials,
    ...displayTestimonials,
    ...displayTestimonials,
    ...displayTestimonials,
  ];

  return (
    <section className="section-container testimonials-section">
      <motion.div
        className="years-badge"
        initial={{ scale: 0, rotate: -180 }}
        whileInView={{ scale: 1, rotate: 0 }}
        viewport={{ once: true }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        <span className="years-number">20+</span>
        <span className="years-text">Years of Excellence</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="section-title">{t('pages.home.testimonials.title')}</h2>
        <p className="section-subtitle">{t('pages.home.testimonials.subtitle')}</p>
      </motion.div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Loading reviews...</p>
        </div>
      ) : (
        <motion.div
          className="testimonial-marquee"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          <div className="testimonial-track">
            {allTestimonials.map((testimonial, index) => (
              <div className="testimonial-card" key={`${testimonial.id}-${index}`}>
                <div className="stars">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={20}
                      fill={i < testimonial.rating ? '#eebb4d' : 'none'}
                      color={i < testimonial.rating ? '#eebb4d' : '#ddd'}
                    />
                  ))}
                </div>

                <div className="quote-icon">
                  <Quote size={32} color="#e0e0e0" />
                </div>

                <p className="testimonial-text">"{testimonial.text}"</p>

                <div className="testimonial-author">
                  <div className="author-avatar">{testimonial.name.charAt(0)}</div>
                  <div className="author-info">
                    <h4 className="author-name">{testimonial.name}</h4>
                    {testimonial.location && (
                      <p className="author-location">{testimonial.location}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </section>
  );
};

export default TestimonialsSection;
