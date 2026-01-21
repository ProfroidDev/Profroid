import React from 'react';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import '../HomePage.css';
import './ContactSection.css';

const ContactSection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section className="section-container contact-section">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="section-title">{t('pages.home.contact.title')}</h2>
        <p className="section-subtitle">{t('pages.home.contact.subtitle')}</p>
      </motion.div>

      <div className="contact-grid">
        <motion.div
          className="contact-card"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="contact-icon">
            <Phone size={32} />
          </div>
          <h3 className="contact-title">{t('pages.home.contact.phone.title')}</h3>
          <p className="contact-info">+1 (514) 123-4567</p>
          <p className="contact-sub-info">{t('pages.home.contact.phone.availability')}</p>
        </motion.div>

        <motion.div
          className="contact-card"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="contact-icon">
            <Mail size={32} />
          </div>
          <h3 className="contact-title">{t('pages.home.contact.email.title')}</h3>
          <p className="contact-info">info@profroid.com</p>
          <p className="contact-sub-info">{t('pages.home.contact.email.response')}</p>
        </motion.div>

        <motion.div
          className="contact-card"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="contact-icon">
            <MapPin size={32} />
          </div>
          <h3 className="contact-title">{t('pages.home.contact.location.title')}</h3>
          <p className="contact-info">123 Wine Street</p>
          <p className="contact-sub-info">Montreal, QC H1A 1A1</p>
        </motion.div>

        <motion.div
          className="contact-card"
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="contact-icon">
            <Clock size={32} />
          </div>
          <h3 className="contact-title">{t('pages.home.contact.hours.title')}</h3>
          <p className="contact-info">{t('pages.home.contact.hours.weekdays')}</p>
          <p className="contact-sub-info">{t('pages.home.contact.hours.weekends')}</p>
        </motion.div>
      </div>
    </section>
  );
};

export default ContactSection;
