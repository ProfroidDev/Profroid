import React from "react";
import { Thermometer, Wrench, Zap, Shield, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import "../HomePage.css";
import "./ServicesSection.css";

const ServicesSection: React.FC = () => {
  const { t } = useTranslation();

  const services = [
    {
      icon: <Thermometer size={32} />,
      title: t('pages.home.services.items.quotation.title'),
      description: t('pages.home.services.items.quotation.description'),
      price: t('pages.home.services.items.quotation.price'),
    },
    {
      icon: <Wrench size={32} />,
      title: t('pages.home.services.items.installation.title'),
      description: t('pages.home.services.items.installation.description'),
      price: t('pages.home.services.items.installation.price'),
    },
    {
      icon: <Zap size={32} />,
      title: t('pages.home.services.items.repair.title'),
      description: t('pages.home.services.items.repair.description'),
      price: t('pages.home.services.items.repair.price'),
    },
    {
      icon: <Shield size={32} />,
      title: t('pages.home.services.items.maintenance.title'),
      description: t('pages.home.services.items.maintenance.description'),
      price: t('pages.home.services.items.maintenance.price'),
    },
  ];
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <section className="section-container services-section">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="section-title">{t('pages.home.services.title')}</h2>
        <p className="section-subtitle">
          {t('pages.home.services.subtitle')}
        </p>
      </motion.div>

      <motion.div
        className="services-grid"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {services.map((service, index) => (
          <motion.div
            className="service-card"
            key={index}
            variants={itemVariants}
            whileHover={{ scale: 1.03 }}
          >
            <div className="service-icon">{service.icon}</div>
            <h3 className="service-title">{service.title}</h3>
            <p className="service-description">{service.description}</p>
            <p className="service-price">{service.price}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="services-action"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <Link to="/services" className="btn-primary browse-services-btn">
          {t('pages.home.services.browseAll')} <ArrowRight size={18} style={{ marginLeft: 8 }} />
        </Link>
      </motion.div>
    </section>
  );
};

export default ServicesSection;
