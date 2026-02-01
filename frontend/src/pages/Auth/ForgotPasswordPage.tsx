import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import authClient from '../../features/authentication/api/authClient';
import { sanitizeEmail, validateAndSanitizeEmail } from '../../utils/sanitizer';
import '../Auth.css';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleEmailChange = (value: string) => {
    // Sanitize email as user types
    const sanitized = sanitizeEmail(value);
    setEmail(sanitized);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email) {
      setError(t('common.required'));
      return;
    }

    // Validate and sanitize email before submission
    const emailValidation = validateAndSanitizeEmail(email);
    if (!emailValidation.isValid) {
      setError(emailValidation.error || t('validation.emailInvalid'));
      return;
    }

    // Final sanitization before sending to backend
    const sanitizedEmail = sanitizeEmail(email);

    setIsLoading(true);

    try {
      const response = await authClient.forgotPassword(sanitizedEmail);

      if (response.success) {
        setSuccess(true);
        setEmail(''); // Clear the form
      } else {
        setError(response.error || t('messages.error'));
      }
    } catch {
      setError(t('messages.error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>{t('auth.forgotPassword')}</h1>
          <p>{t('auth.passwordReset')}</p>
        </div>

        {success ? (
          <div className="success-message">
            <div className="alert alert-success">
              <strong>✓ {t('auth.checkEmail')}</strong>
              <p>{t('auth.checkEmail')}</p>
              <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>{t('messages.success')}</p>
            </div>

            <div className="auth-footer" style={{ marginTop: '1.5rem' }}>
              <Link to="/auth/login" className="btn-secondary">
                {t('auth.login')}
              </Link>
            </div>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-form-group">
                <label htmlFor="email">{t('common.email')}</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder={t('auth.enterEmail')}
                  disabled={isLoading}
                  required
                  autoComplete="email"
                />
              </div>

              {error && <div className="alert alert-error">{error}</div>}

              <button type="submit" disabled={isLoading} className="btn-primary">
                {isLoading ? t('common.loading') : t('auth.resetPassword')}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                {t('auth.alreadyHaveAccount')}{' '}
                <Link to="/auth/login" className="link">
                  {t('auth.login')}
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
