import React from "react";
import { Star, Quote } from "lucide-react";
import { motion } from "framer-motion";
import "../HomePage.css";
import "./TestimonialsSection.css";

const testimonials = [
  {
    id: 1,
    name: "Marc Dupont",
    location: "Montreal, QC",
    rating: 5,
    text: "Profroid saved my wine collection! Their technician diagnosed the cooling issue within minutes and had it fixed the same day.",
  },
  {
    id: 2,
    name: "Sophie Martin",
    location: "Quebec City, QC",
    rating: 5,
    text: "Excellent service and very professional. They explained everything clearly and the pricing was transparent. Highly recommended!",
  },
  {
    id: 3,
    name: "Jean-Luc Tremblay",
    location: "Laval, QC",
    rating: 4,
    text: "Great experience overall. The technician was on time and very knowledgeable about my specific wine cellar model.",
  },
];

const TestimonialsSection: React.FC = () => {
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
        <h2 className="section-title">What Our Clients Say</h2>
        <p className="section-subtitle">
          Trusted by wine collectors across Quebec
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
