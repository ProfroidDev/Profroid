import React from "react";
import { Thermometer, Wrench, Zap, Shield, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "../HomePage.css";
import "./ServicesSection.css";

const services = [
  {
    icon: <Thermometer size={32} />,
    title: "Free Quotation",
    description:
      "Technician visits the site to evaluate cellar needs and prepare a detailed quote.",
    price: "From $0.00",
  },
  {
    icon: <Wrench size={32} />,
    title: "Cellar Installation",
    description:
      "Full installation of a new refrigeration system, wiring, tubing, and calibration.",
    price: "From $120.00",
  },
  {
    icon: <Zap size={32} />,
    title: "Repair Service",
    description:
      "Diagnosis and repair of refrigeration, humidity control, or electrical issues.",
    price: "From $95.00",
  },
  {
    icon: <Shield size={32} />,
    title: "Annual Maintenance",
    description:
      " Full system checkup, cleaning, refrigerant check and performance optimization.",
    price: "From $85.00",
  },
];

const ServicesSection: React.FC = () => {
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
        <h2 className="section-title">Our Services</h2>
        <p className="section-subtitle">
          Professional wine cellar repair services to keep your collection
          perfectly preserved
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
          View Services <ArrowRight size={18} style={{ marginLeft: 8 }} />
        </Link>
      </motion.div>
    </section>
  );
};

export default ServicesSection;
