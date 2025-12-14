import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import "../HomePage.css";
import "./FAQSection.css";

const faqs = [
  {
    question: "How quickly can you respond to emergency repairs?",
    answer:
      "We offer 24/7 emergency services for critical wine cellar issues. Our technicians typically arrive within 2-4 hours for emergency calls in the greater Montreal area.",
  },
  {
    question: "What types of wine cellar systems do you service?",
    answer:
      "We service all major brands and types of wine cellar cooling systems, including split systems, ducted systems, and through-the-wall units. Our technicians are certified to work on brands like EuroCave, WhisperKOOL, CellarPro, and more.",
  },
  {
    question: "How often should I have my wine cellar serviced?",
    answer:
      "We recommend preventive maintenance at least once a year. For larger commercial cellars or high-value collections, semi-annual maintenance (every 6 months) is ideal to ensure optimal performance and longevity.",
  },
  {
    question: "Do you offer warranties on repairs?",
    answer:
      "Yes, we stand behind our work. All repairs come with a 90-day warranty on labor and a manufacturer's warranty on any parts replaced.",
  },
  {
    question: "What areas do you serve?",
    answer:
      "We serve the greater Montreal area, including Laval, Longueuil, the North Shore, and the South Shore. Contact us to check if we service your specific location.",
  },
  {
    question: "How do I know if my wine cellar cooling unit needs repair?",
    answer:
      "Common signs include temperature fluctuations, unusual noises, water leaks, or the unit running constantly. If you notice any of these, it's best to call a professional immediately to prevent damage to your wine collection.",
  },
  {
    question: "Can you help with wine cellar design and installation?",
    answer:
      "While our primary focus is on repair and maintenance, we partner with top designers and installers. We can provide consultation on the best cooling systems for your planned cellar and refer you to trusted partners for the build.",
  },
  {
    question: "What is the ideal temperature and humidity for a wine cellar?",
    answer:
      "The ideal temperature for storing wine is generally between 55°F (13°C) and 58°F (14°C). Humidity should be kept between 50% and 70% to keep corks moist and prevent oxidation.",
  },
];

const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="section-container faq-section">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="section-title">Frequently Asked Questions</h2>
        <p className="section-subtitle">
          Have questions? We've got answers. Find what you need below.
        </p>
      </motion.div>

      <div className="faq-list">
        {faqs.map((faq, index) => (
          <motion.div
            key={index}
            className={`faq-item ${openIndex === index ? "open" : ""}`}
            onClick={() => toggleFAQ(index)}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <div className="faq-question">
              <h3>{faq.question}</h3>
              <span className="faq-icon">
                {openIndex === index ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </span>
            </div>
            <AnimatePresence>
              {openIndex === index && (
                <motion.div
                  className="faq-answer"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <p>{faq.answer}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default FAQSection;
