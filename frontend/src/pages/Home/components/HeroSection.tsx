import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import "../HomePage.css";
import "./HeroSection.css";

const HeroSection: React.FC = () => {
  return (
    <section className="hero-section">
      <div className="hero-overlay"></div>
      <div className="hero-content">
        <motion.h1
          className="hero-title"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          Expert Cellar Repairs
        </motion.h1>
        <motion.p
          className="hero-description"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        >
          Professional wine cellar repair and maintenance services to keep your
          collection perfectly preserved.
        </motion.p>
        <motion.div
          className="hero-buttons"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
        >
          <Link to="/services" className="btn-primary hero-btn">
            View Services <ArrowRight size={18} style={{ marginLeft: 8 }} />
          </Link>
          <Link to="/contact" className="btn-secondary hero-btn-outline">
            Contact Us
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
