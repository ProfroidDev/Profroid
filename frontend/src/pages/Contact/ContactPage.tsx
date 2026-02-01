import { useTranslation } from 'react-i18next';
import { Mail, Phone, MapPin } from 'lucide-react';
import './Contact.css';
import { useState } from 'react';
import {
  sanitizeName,
  sanitizeEmail,
  sanitizePhoneNumber,
  sanitizeInput,
} from '../../utils/sanitizer';

export default function ContactPage() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    let sanitizedValue = value;
    if (name === 'name') {
      sanitizedValue = sanitizeName(value);
    } else if (name === 'email') {
      sanitizedValue = sanitizeEmail(value);
    } else if (name === 'phone') {
      sanitizedValue = sanitizePhoneNumber(value);
    } else if (name === 'subject') {
      sanitizedValue = sanitizeInput(value);
    } else if (name === 'message') {
      sanitizedValue = sanitizeInput(value);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: sanitizedValue,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would send this to a backend service
    alert(t('pages.contact.messageSent'));
    setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
  };

  return (
    <div className="contact-page">
      <div className="contact-hero">
        <h1>{t('pages.contact.title')}</h1>
        <p className="contact-subtitle">{t('pages.contact.subtitle')}</p>
      </div>

      <div className="contact-container">
        <div className="contact-info">
          <div className="info-item">
            <Mail className="info-icon" />
            <div>
              <h3>{t('pages.contact.email')}</h3>
              <p>support@profroid.com</p>
            </div>
          </div>

          <div className="info-item">
            <Phone className="info-icon" />
            <div>
              <h3>{t('pages.contact.phone')}</h3>
              <p>+1 (514) 555-0123</p>
            </div>
          </div>

          <div className="info-item">
            <MapPin className="info-icon" />
            <div>
              <h3>{t('pages.contact.address')}</h3>
              <p>123 Main St, Toronto, ON M5V 3A8</p>
            </div>
          </div>
        </div>

        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">{t('pages.contact.formName')}</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder={t('pages.contact.formNamePlaceholder')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">{t('pages.contact.formEmail')}</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder={t('pages.contact.formEmailPlaceholder')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">{t('pages.contact.formPhone')}</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder={t('pages.contact.formPhonePlaceholder')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="subject">{t('pages.contact.formSubject')}</label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              placeholder={t('pages.contact.formSubjectPlaceholder')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">{t('pages.contact.formMessage')}</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              placeholder={t('pages.contact.formMessagePlaceholder')}
              rows={6}
            />
          </div>

          <button type="submit" className="submit-button">
            {t('pages.contact.formSubmit')}
          </button>
        </form>
      </div>
    </div>
  );
}
