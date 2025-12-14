import React from "react";
import { ThermometerSun, Sparkles, Settings } from "lucide-react";
import { motion } from "framer-motion";
import "../HomePage.css";
import "./WhyChooseUsSection.css";

const features = [
  {
    icon: <ThermometerSun size={40} />,
    title: "Precision Climate Control",
    description:
      "Maintain perfect temperature and humidity levels with advanced monitoring systems",
  },
  {
    icon: <Sparkles size={40} />,
    title: "Expert Repairs",
    description:
      "Certified technicians with years of experience in wine cellar restoration",
  },
  {
    icon: <Settings size={40} />,
    title: "Smart Technology",
    description:
      "Monitor and control your wine cellar remotely with integrated smart systems",
  },
];

const WhyChooseUsSection: React.FC = () => {
  return (
    <section className="section-container why-choose-us-section">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="section-title">Why Choose Profroid</h2>
        <p className="section-subtitle">
          Our repair services combine cutting-edge technology with timeless
          craftsmanship
        </p>
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
