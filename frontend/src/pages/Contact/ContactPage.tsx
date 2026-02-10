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

  const [isLoading, setIsLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [responseType, setResponseType] = useState<'success' | 'error' | ''>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResponseMessage('');
    setResponseType('');

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080/api/v1';
      const response = await fetch(`${backendUrl}/contact/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setResponseMessage(t('pages.contact.messageSent'));
        setResponseType('success');
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
        // Auto-clear success message after 5 seconds
        setTimeout(() => setResponseMessage(''), 5000);
      } else if (response.status === 429) {
        // Rate limit exceeded
        const errorData = await response.json().catch(() => ({}));
        setResponseMessage(errorData.message || 'Too many messages. Please wait before sending another message.');
        setResponseType('error');
      } else {
        const errorData = await response.json().catch(() => ({}));
        setResponseMessage(errorData.message || 'Failed to send message. Please try again.');
        setResponseType('error');
      }
    } catch (error) {
      console.error('Error sending contact message:', error);
      setResponseMessage('Failed to send message. Please try again later.');
      setResponseType('error');
    } finally {
      setIsLoading(false);
    }
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
          <div className="auth-form-group">
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

          <div className="auth-form-group">
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

          <div className="auth-form-group">
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

          <div className="auth-form-group">
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

          <div className="auth-form-group">
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

          {responseMessage && (
            <div className={`response-message response-${responseType}`}>
              {responseMessage}
            </div>
          )}

          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? t('pages.contact.formSubmitting') || 'Sending...' : t('pages.contact.formSubmit')}
          </button>
        </form>
      </div>
    </div>
  );
}
