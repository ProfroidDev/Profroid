import { useTranslation } from 'react-i18next';
import { Mail, Phone, MapPin } from 'lucide-react';
import './Contact.css';
import { useState, useEffect, useRef } from 'react';
import {
  sanitizeName,
  sanitizeEmail,
  sanitizePhoneNumber,
  sanitizeInput,
} from '../../utils/sanitizer';

export default function ContactPage() {
  const { t } = useTranslation();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState(() => {
    // Load response message from localStorage on mount
    return localStorage.getItem('responseMessage') || '';
  });
  const [responseType, setResponseType] = useState<'success' | 'error' | ''>(() => {
    // Load response type from localStorage on mount
    const stored = localStorage.getItem('responseType');
    return (stored as 'success' | 'error' | '') || '';
  });
  const [rateLimitTime, setRateLimitTime] = useState(() => {
    // Load rate limit time from localStorage on mount
    const stored = localStorage.getItem('rateLimitTime');
    return stored ? parseInt(stored, 10) : 0;
  }); // countdown in seconds

  // Character limits for fields
  const LIMITS = {
    name: 50,
    email: 75,
    phone: 20,
    subject: 75,
    message: 500,
  };

  // Rate limit countdown timer - use ref to maintain single interval
  useEffect(() => {
    // Clean up any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Don't start interval if time is 0 or less
    if (rateLimitTime <= 0) {
      localStorage.removeItem('rateLimitTime');
      localStorage.removeItem('responseMessage');
      localStorage.removeItem('responseType');
      return;
    }

    // Start countdown interval
    intervalRef.current = setInterval(() => {
      setRateLimitTime((prev) => {
        const newTime = prev - 1;
        
        if (newTime <= 0) {
          // Timer finished - clean up
          setResponseMessage('');
          setResponseType('');
          localStorage.removeItem('rateLimitTime');
          localStorage.removeItem('responseMessage');
          localStorage.removeItem('responseType');
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return 0;
        }
        
        // Update localStorage as timer counts down
        localStorage.setItem('rateLimitTime', newTime.toString());
        return newTime;
      });
    }, 1000);

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [rateLimitTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Enforce character limit
    const limit = LIMITS[name as keyof typeof LIMITS];
    if (value.length > limit) {
      return;
    }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is rate limited - show message but don't send request
    if (rateLimitTime > 0) {
      const message = t('pages.contact.rateLimitExceeded');
      setResponseMessage(message);
      setResponseType('error');
      localStorage.setItem('responseMessage', message);
      localStorage.setItem('responseType', 'error');
      return;
    }

    setResponseMessage('');
    setResponseType('');

    // Validate form before submitting
    if (formData.name.length < 2) {
      const msg = t('pages.contact.validationNameMin');
      setResponseMessage(msg);
      setResponseType('error');
      localStorage.setItem('responseMessage', msg);
      localStorage.setItem('responseType', 'error');
      return;
    }
    if (formData.name.length > LIMITS.name) {
      const msg = t('pages.contact.validationNameMax');
      setResponseMessage(msg);
      setResponseType('error');
      localStorage.setItem('responseMessage', msg);
      localStorage.setItem('responseType', 'error');
      return;
    }
    if (formData.subject.length < 3) {
      const msg = t('pages.contact.validationSubjectMin');
      setResponseMessage(msg);
      setResponseType('error');
      localStorage.setItem('responseMessage', msg);
      localStorage.setItem('responseType', 'error');
      return;
    }
    if (formData.subject.length > LIMITS.subject) {
      const msg = t('pages.contact.validationSubjectMax');
      setResponseMessage(msg);
      setResponseType('error');
      localStorage.setItem('responseMessage', msg);
      localStorage.setItem('responseType', 'error');
      return;
    }
    if (formData.message.length < 10) {
      const msg = t('pages.contact.validationMessageMin');
      setResponseMessage(msg);
      setResponseType('error');
      localStorage.setItem('responseMessage', msg);
      localStorage.setItem('responseType', 'error');
      return;
    }
    if (formData.message.length > LIMITS.message) {
      const msg = t('pages.contact.validationMessageMax');
      setResponseMessage(msg);
      setResponseType('error');
      localStorage.setItem('responseMessage', msg);
      localStorage.setItem('responseType', 'error');
      return;
    }

    setIsLoading(true);

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
        localStorage.setItem('responseMessage', t('pages.contact.messageSent'));
        localStorage.setItem('responseType', 'success');
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
        setRateLimitTime(0);
        localStorage.removeItem('rateLimitTime');
        // Auto-clear success message after 5 seconds
        setTimeout(() => {
          setResponseMessage('');
          setResponseType('');
          localStorage.removeItem('responseMessage');
          localStorage.removeItem('responseType');
        }, 5000);
      } else if (response.status === 429) {
        // Rate limit exceeded - set 20 minute countdown
        const message = t('pages.contact.rateLimitExceeded');
        setResponseMessage(message);
        setResponseType('error');
        setRateLimitTime(1200); // 20 minutes in seconds
        localStorage.setItem('rateLimitTime', '1200');
        localStorage.setItem('responseMessage', message);
        localStorage.setItem('responseType', 'error');
      } else {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.message || t('pages.contact.failedToSend');
        setResponseMessage(message);
        setResponseType('error');
        localStorage.setItem('responseMessage', message);
        localStorage.setItem('responseType', 'error');
      }
    } catch (error) {
      console.error('Error sending contact message:', error);
      const message = t('pages.contact.failedToSend');
      setResponseMessage(message);
      localStorage.setItem('responseMessage', message);
      localStorage.setItem('responseType', 'error');
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
            <label htmlFor="name">
              {t('pages.contact.formName')}
              <span
                className={`char-limit ${formData.name.length >= LIMITS.name * 0.9 ? 'at-limit' : ''}`}
              >
                {formData.name.length}/{LIMITS.name}
              </span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              maxLength={LIMITS.name}
              required
              placeholder={t('pages.contact.formNamePlaceholder')}
            />
          </div>

          <div className="auth-form-group">
            <label htmlFor="email">
              {t('pages.contact.formEmail')}
              <span
                className={`char-limit ${formData.email.length >= LIMITS.email * 0.9 ? 'at-limit' : ''}`}
              >
                {formData.email.length}/{LIMITS.email}
              </span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              maxLength={LIMITS.email}
              required
              placeholder={t('pages.contact.formEmailPlaceholder')}
            />
          </div>

          <div className="auth-form-group">
            <label htmlFor="phone">
              {t('pages.contact.formPhone')}
              <span
                className={`char-limit ${formData.phone.length >= LIMITS.phone * 0.9 ? 'at-limit' : ''}`}
              >
                {formData.phone.length}/{LIMITS.phone}
              </span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              maxLength={LIMITS.phone}
              placeholder={t('pages.contact.formPhonePlaceholder')}
            />
          </div>

          <div className="auth-form-group">
            <label htmlFor="subject">
              {t('pages.contact.formSubject')}
              <span
                className={`char-limit ${formData.subject.length >= LIMITS.subject * 0.9 ? 'at-limit' : ''}`}
              >
                {formData.subject.length}/{LIMITS.subject}
              </span>
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              maxLength={LIMITS.subject}
              required
              placeholder={t('pages.contact.formSubjectPlaceholder')}
            />
          </div>

          <div className="auth-form-group">
            <label htmlFor="message">
              {t('pages.contact.formMessage')}
              <span
                className={`char-limit ${formData.message.length >= LIMITS.message * 0.9 ? 'at-limit' : ''}`}
              >
                {formData.message.length}/{LIMITS.message}
              </span>
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              maxLength={LIMITS.message}
              required
              placeholder={t('pages.contact.formMessagePlaceholder')}
              rows={6}
            />
          </div>

          {responseMessage && (
            <div
              className={`response-message ${rateLimitTime > 0 ? 'rate-limit-warning' : `response-${responseType}`}`}
            >
              {rateLimitTime > 0 ? (
                <span>
                  {t('pages.contact.rateLimitExceeded')} {t('pages.contact.waitMessage')}{' '}
                  <strong>{formatTime(rateLimitTime)}</strong>
                </span>
              ) : (
                <span>{responseMessage}</span>
              )}
            </div>
          )}

          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading
              ? t('pages.contact.formSubmitting') || 'Sending...'
              : t('pages.contact.formSubmit')}
          </button>
        </form>
      </div>
    </div>
  );
}
