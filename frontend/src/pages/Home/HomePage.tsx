import React from "react";
import HeroSection from "./components/HeroSection";
import ServicesSection from "./components/ServicesSection";
import WhyChooseUsSection from "./components/WhyChooseUsSection";
import TestimonialsSection from "./components/TestimonialsSection";
import FeedbackSection from "./components/FeedbackSection";
import FAQSection from "./components/FAQSection";
import ContactSection from "./components/ContactSection";
import "./HomePage.css";

const HomePage: React.FC = () => {
  return (
    <div className="home-page">
      <HeroSection />
      <ServicesSection />
      <WhyChooseUsSection />
      <TestimonialsSection />
      <FeedbackSection />
      <FAQSection />
      <ContactSection />
    </div>
  );
};

export default HomePage;
