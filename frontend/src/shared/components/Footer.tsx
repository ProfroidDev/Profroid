import { Wine } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './Footer.css';

export default function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-container">
      <div className="footer-inner">
        <div className="footer-brand">
          <Wine className="footer-icon" />
          <span className="footer-logo">Profroid</span>
          <p className="footer-desc">
            {t('footer.tagline')}
          </p>
        </div>

        <div className="footer-section">
          <h4>{t('footer.quickLinks')}</h4>
          <a href="/about">{t('footer.about')}</a>
          <a href="/privacy">{t('footer.privacyPolicy')}</a>
          <a href="/services">{t('footer.services')}</a>
          <a href="/contact">{t('footer.contact')}</a>
        </div>

        <div className="footer-section">
          <h4>{t('footer.resources')}</h4>
          <a href="/warranty">{t('footer.warranty')}</a>
        </div>
      </div>

      <div className="footer-bottom">
        {t('footer.copyright', { year: currentYear })}
      </div>
    </footer>
  );
}
