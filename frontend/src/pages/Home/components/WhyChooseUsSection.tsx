import React from 'react';
import { ThermometerSun, Sparkles, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import '../HomePage.css';
import './WhyChooseUsSection.css';

const WhyChooseUsSection: React.FC = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: <ThermometerSun size={40} />,
      title: t('pages.home.whyChooseUs.certified.title'),
      description: t('pages.home.whyChooseUs.certified.description'),
    },
    {
      icon: <Sparkles size={40} />,
      title: t('pages.home.whyChooseUs.support.title'),
      description: t('pages.home.whyChooseUs.support.description'),
    },
    {
      icon: <Settings size={40} />,
      title: t('pages.home.whyChooseUs.expertise.title'),
      description: t('pages.home.whyChooseUs.expertise.description'),
    },
  ];

  return (
    <section className="section-container why-choose-us-section">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="section-title">{t('pages.home.whyChooseUs.title')}</h2>
        <p className="section-subtitle">{t('pages.home.whyChooseUs.subtitle')}</p>
      </motion.div>

      <div className="features-grid">
        {features.map((feature, index) => (
          <motion.div
            className="feature-item"
            key={index}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.2 }}
            whileHover={{ y: -10 }}
          >
            <div className="feature-icon">{feature.icon}</div>
            <h3 className="feature-title">{feature.title}</h3>
            <p className="feature-description">{feature.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default WhyChooseUsSection;
