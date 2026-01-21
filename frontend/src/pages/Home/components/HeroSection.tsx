import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import '../HomePage.css';
import './HeroSection.css';

const HeroSection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section className="hero-section">
      <div className="hero-overlay"></div>
      <div className="hero-content">
        <motion.h1
          className="hero-title"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          {t('pages.home.hero.title')}
        </motion.h1>
        <motion.p
          className="hero-description"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
        >
          {t('pages.home.hero.subtitle')}
        </motion.p>
        <motion.div
          style={{
            backgroundColor: '#722f37',
            color: 'white',
            padding: '1.5rem',
            margin: '2rem 0',
            borderRadius: '12px',
            textAlign: 'center',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        >
          <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}> CI/CD Pipeline Demo - v2.0</h2>
          <p style={{ margin: 0, opacity: 0.9 }}>Deployed via GitHub Actions • {new Date().toLocaleDateString()}</p>
        </motion.div>
        <motion.div
          className="hero-buttons"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
        >
          <Link to="/services" className="btn-primary hero-btn">
            {t('pages.home.hero.cta')} <ArrowRight size={18} style={{ marginLeft: 8 }} />
          </Link>
          <Link to="/contact" className="btn-secondary hero-btn-outline">
            {t('pages.home.contact.title')}
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
