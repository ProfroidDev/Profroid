import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { createWarrantyClaim } from '../../features/warranty/api/createWarrantyClaim';
import {
  sanitizeAddress,
  sanitizeEmail,
  sanitizeInput,
  sanitizeName,
  sanitizePhoneNumber,
} from '../../utils/sanitizer';
import { trimToMaxWords } from '../../utils/wordLimit';
import './WarrantyPage.css';

export default function WarrantyPage() {
  const { t } = useTranslation();
  const ISSUE_DESCRIPTION_MAX_WORDS = 200;
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    productName: '',
    productSerialNumber: '',
    purchaseDate: '',
    issueDescription: '',
    preferredContactMethod: 'EMAIL',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    let sanitizedValue = value;

    if (name === 'customerName') {
      sanitizedValue = sanitizeName(value);
    } else if (name === 'customerEmail') {
      sanitizedValue = sanitizeEmail(value);
    } else if (name === 'customerPhone') {
      sanitizedValue = sanitizePhoneNumber(value);
    } else if (name === 'customerAddress') {
      sanitizedValue = sanitizeAddress(value);
    } else if (name === 'productName' || name === 'productSerialNumber') {
      sanitizedValue = sanitizeInput(value);
    } else if (name === 'issueDescription') {
      sanitizedValue = trimToMaxWords(sanitizeInput(value), ISSUE_DESCRIPTION_MAX_WORDS);
    }

    setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      await createWarrantyClaim(formData);

      setSubmitSuccess(true);
      setFormData({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        customerAddress: '',
        productName: '',
        productSerialNumber: '',
        purchaseDate: '',
        issueDescription: '',
        preferredContactMethod: 'EMAIL',
      });

      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Error submitting warranty claim:', error);
      setSubmitError('Failed to submit your claim. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="warranty-page">
      <div className="warranty-hero">
        <div className="warranty-hero-content">
          <h1>{t('pages.warranty.title')}</h1>
          <p className="warranty-hero-subtitle">{t('pages.warranty.subtitle')}</p>
        </div>
      </div>

      <div className="warranty-container">
        {submitSuccess && (
          <div className="warranty-success-message">
            <h3>✓ {t('pages.warranty.form.successTitle')}</h3>
            <p>{t('pages.warranty.form.successMessage')}</p>
          </div>
        )}

        <div className="warranty-toc">
          <h3>{t('pages.warranty.tableOfContents')}</h3>
          <ul>
            <li>
              <a href="#overview">{t('pages.warranty.overview')}</a>
            </li>
            <li>
              <a href="#coverage">{t('pages.warranty.coverageTitle')}</a>
            </li>
            <li>
              <a href="#duration">{t('pages.warranty.durationTitle')}</a>
            </li>
            <li>
              <a href="#exclusions">{t('pages.warranty.exclusionsTitle')}</a>
            </li>
            <li>
              <a href="#claim-process">{t('pages.warranty.claimProcessTitle')}</a>
            </li>
            <li>
              <a href="#contact">{t('pages.warranty.contactTitle')}</a>
            </li>
            <li>
              <a href="#claim-form">{t('pages.warranty.form.title')}</a>
            </li>
          </ul>
        </div>

        <section id="overview" className="warranty-section">
          <h2>{t('pages.warranty.overview')}</h2>
          <p>{t('pages.warranty.overviewText')}</p>
          <div className="warranty-highlight">
            <p>{t('pages.warranty.overviewHighlight')}</p>
          </div>
        </section>

        <section id="coverage" className="warranty-section">
          <h2>{t('pages.warranty.coverageTitle')}</h2>
          <p>{t('pages.warranty.coverageText')}</p>

          <div className="warranty-coverage-list">
            <div className="coverage-item">
              <h4>✓ {t('pages.warranty.coverage1Title')}</h4>
              <p>{t('pages.warranty.coverage1Text')}</p>
            </div>
            <div className="coverage-item">
              <h4>✓ {t('pages.warranty.coverage2Title')}</h4>
              <p>{t('pages.warranty.coverage2Text')}</p>
            </div>
            <div className="coverage-item">
              <h4>✓ {t('pages.warranty.coverage3Title')}</h4>
              <p>{t('pages.warranty.coverage3Text')}</p>
            </div>
            <div className="coverage-item">
              <h4>✓ {t('pages.warranty.coverage4Title')}</h4>
              <p>{t('pages.warranty.coverage4Text')}</p>
            </div>
          </div>
        </section>

        <section id="duration" className="warranty-section">
          <h2>{t('pages.warranty.durationTitle')}</h2>
          <p>{t('pages.warranty.durationText')}</p>

          <div className="warranty-info-box">
            <h4>{t('pages.warranty.durationDetailsTitle')}</h4>
            <ul>
              <li>{t('pages.warranty.durationDetail1')}</li>
              <li>{t('pages.warranty.durationDetail2')}</li>
              <li>{t('pages.warranty.durationDetail3')}</li>
            </ul>
          </div>
        </section>

        <section id="exclusions" className="warranty-section">
          <h2>{t('pages.warranty.exclusionsTitle')}</h2>
          <p>{t('pages.warranty.exclusionsText')}</p>

          <div className="warranty-warning-box">
            <h4>{t('pages.warranty.exclusionsWarning')}</h4>
            <ul>
              <li>{t('pages.warranty.exclusion1')}</li>
              <li>{t('pages.warranty.exclusion2')}</li>
              <li>{t('pages.warranty.exclusion3')}</li>
              <li>{t('pages.warranty.exclusion4')}</li>
              <li>{t('pages.warranty.exclusion5')}</li>
            </ul>
          </div>
        </section>

        <section id="claim-process" className="warranty-section">
          <h2>{t('pages.warranty.claimProcessTitle')}</h2>
          <p>{t('pages.warranty.claimProcessText')}</p>

          <div className="warranty-process-steps">
            <div className="process-step">
              <div className="step-number">1</div>
              <h4>{t('pages.warranty.step1Title')}</h4>
              <p>{t('pages.warranty.step1Text')}</p>
            </div>
            <div className="process-step">
              <div className="step-number">2</div>
              <h4>{t('pages.warranty.step2Title')}</h4>
              <p>{t('pages.warranty.step2Text')}</p>
            </div>
            <div className="process-step">
              <div className="step-number">3</div>
              <h4>{t('pages.warranty.step3Title')}</h4>
              <p>{t('pages.warranty.step3Text')}</p>
            </div>
            <div className="process-step">
              <div className="step-number">4</div>
              <h4>{t('pages.warranty.step4Title')}</h4>
              <p>{t('pages.warranty.step4Text')}</p>
            </div>
          </div>
        </section>

        <section id="contact" className="warranty-section">
          <h2>{t('pages.warranty.contactTitle')}</h2>
          <p>{t('pages.warranty.contactText')}</p>

          <div className="warranty-contact-box">
            <div className="contact-method">
              <h4>{t('pages.warranty.contactEmailTitle')}</h4>
              <a href="mailto:profroid@hotmail.com">{t('pages.warranty.contactEmailValue')}</a>
            </div>
            <div className="contact-method">
              <h4>{t('pages.warranty.contactPhoneTitle')}</h4>
              <a href="tel:+15145853298">{t('pages.warranty.contactPhoneValue')}</a>
            </div>
            <div className="contact-method">
              <h4>{t('pages.warranty.contactMailTitle')}</h4>
              <p>
                Profroid Inc.
                <br />
                {t('pages.warranty.contactAddress')}
              </p>
            </div>
          </div>
        </section>

        <section id="claim-form" className="warranty-section warranty-form-section">
          <h2>{t('pages.warranty.form.title')}</h2>
          <p>{t('pages.warranty.form.subtitle')}</p>

          {submitError && (
            <div className="warranty-error-message">
              <p>{submitError}</p>
            </div>
          )}

          <form className="warranty-claim-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="customerName">{t('pages.warranty.form.name')} *</label>
                <input
                  type="text"
                  id="customerName"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  required
                  minLength={2}
                  maxLength={100}
                />
              </div>

              <div className="form-group">
                <label htmlFor="customerEmail">{t('pages.warranty.form.email')} *</label>
                <input
                  type="email"
                  id="customerEmail"
                  name="customerEmail"
                  value={formData.customerEmail}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="customerPhone">{t('pages.warranty.form.phone')} *</label>
                <input
                  type="tel"
                  id="customerPhone"
                  name="customerPhone"
                  value={formData.customerPhone}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="preferredContactMethod">
                  {t('pages.warranty.form.contactMethod')} *
                </label>
                <select
                  id="preferredContactMethod"
                  name="preferredContactMethod"
                  value={formData.preferredContactMethod}
                  onChange={handleInputChange}
                  required
                >
                  <option value="EMAIL">{t('pages.warranty.form.email')}</option>
                  <option value="PHONE">{t('pages.warranty.form.phone')}</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="customerAddress">{t('pages.warranty.form.address')}</label>
              <input
                type="text"
                id="customerAddress"
                name="customerAddress"
                value={formData.customerAddress}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="productName">{t('pages.warranty.form.product')} *</label>
                <input
                  type="text"
                  id="productName"
                  name="productName"
                  value={formData.productName}
                  onChange={handleInputChange}
                  required
                  minLength={2}
                  maxLength={200}
                />
              </div>

              <div className="form-group">
                <label htmlFor="productSerialNumber">{t('pages.warranty.form.serialNumber')}</label>
                <input
                  type="text"
                  id="productSerialNumber"
                  name="productSerialNumber"
                  value={formData.productSerialNumber}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="purchaseDate">{t('pages.warranty.form.purchaseDate')} *</label>
              <input
                type="date"
                id="purchaseDate"
                name="purchaseDate"
                value={formData.purchaseDate}
                onChange={handleInputChange}
                required
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="form-group">
              <label htmlFor="issueDescription">{t('pages.warranty.form.description')} *</label>
              <textarea
                id="issueDescription"
                name="issueDescription"
                value={formData.issueDescription}
                onChange={handleInputChange}
                required
                minLength={10}
                maxLength={2000}
                rows={6}
                placeholder={t('pages.warranty.form.descriptionPlaceholder')}
              />
              <span className="char-count">{formData.issueDescription.length}/2000</span>
            </div>

            <button type="submit" className="warranty-submit-btn" disabled={isSubmitting}>
              {isSubmitting ? t('pages.warranty.form.submitting') : t('pages.warranty.form.submit')}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
