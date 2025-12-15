import React from "react";
import { Star, Quote } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import "../HomePage.css";
import "./TestimonialsSection.css";

const TestimonialsSection: React.FC = () => {
  const { t } = useTranslation();

  const testimonials = [
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
  // Duplicate testimonials to create a seamless loop
  const allTestimonials = [
    ...testimonials,
    ...testimonials,
    ...testimonials,
    ...testimonials,
  ];

  return (
    <section className="section-container testimonials-section">
      <motion.div
        className="years-badge"
        initial={{ scale: 0, rotate: -180 }}
        whileInView={{ scale: 1, rotate: 0 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
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
        <p className="section-subtitle">
          {t('pages.home.testimonials.subtitle')}
        </p>
      </motion.div>

      <motion.div
        className="testimonial-marquee"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.2 }}
      >
        <div className="testimonial-track">
          {allTestimonials.map((testimonial, index) => (
            <div
              className="testimonial-card"
              key={`${testimonial.id}-${index}`}
            >
              <div className="stars">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={20}
                    fill={i < testimonial.rating ? "#eebb4d" : "none"}
                    color={i < testimonial.rating ? "#eebb4d" : "#ddd"}
                  />
                ))}
              </div>

              <div className="quote-icon">
                <Quote size={32} color="#e0e0e0" />
              </div>

              <p className="testimonial-text">"{testimonial.text}"</p>

              <div className="testimonial-author">
                <div className="author-avatar">
                  {testimonial.name.charAt(0)}
                </div>
                <div className="author-info">
                  <h4 className="author-name">{testimonial.name}</h4>
                  <p className="author-location">{testimonial.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default TestimonialsSection;
