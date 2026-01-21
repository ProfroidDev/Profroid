import { Wine } from "lucide-react";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer-container">
      <div className="footer-inner">

        <div className="footer-brand">
          <Wine className="footer-icon" />
          <span className="footer-logo">Profroid</span>
          <p className="footer-desc">
            Premium wine cellars crafted with precision and elegant design.
          </p>
        </div>

        <div className="footer-section">
          <h4>Quick Links</h4>
          <a href="/about">About</a>
          <a href="/privacy">Privacy Policy</a>
          <a href="/services">Services</a>
          <a href="/contact">Contact</a>
        </div>

        <div className="footer-section">
          <h4>Resources</h4>
          <a href="#">Installation Guide</a>
          <a href="#">Warranty</a>
          <a href="#">Maintenance</a>
          <a href="#">FAQs</a>
        </div>

      </div>

      <div className="footer-bottom">
        © {new Date().getFullYear()} Profroid. All rights reserved.
      </div>
    </footer>
  );
}
