import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import authClient from '../../features/authentication/api/authClient';
import { sanitizeInput, sanitizeToken } from '../../utils/sanitizer';
import '../Auth.css';

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawToken = searchParams.get('token');
  const token = rawToken ? sanitizeToken(rawToken) : null;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!token) {
      setError(t('validation.passwordTooShort'));
    }
  }, [token, t]);

  const validatePassword = (pwd: string): string[] => {
    const errors: string[] = [];

    if (pwd.length < 8) {
      errors.push(t('validation.passwordTooShort'));
    }

    if (!/[A-Z]/.test(pwd)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[0-9]/.test(pwd)) {
      errors.push('Password must contain at least one number');
    }

    return errors;
  };

  const handlePasswordChange = (pwd: string) => {
    // Sanitize password input (remove null bytes and control chars)
    const sanitized = sanitizeInput(pwd);
    setPassword(sanitized);
    if (sanitized) {
      const errors = validatePassword(sanitized);
      setValidationErrors(errors);
    } else {
      setValidationErrors([]);
    }
  };

  const handleConfirmPasswordChange = (pwd: string) => {
    // Sanitize password input
    const sanitized = sanitizeInput(pwd);
    setConfirmPassword(sanitized);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError(t('common.error'));
      return;
    }

    if (!password || !confirmPassword) {
      setError(t('common.required'));
      return;
    }

    // Validate password
    const errors = validatePassword(password);
    if (errors.length > 0) {
      setError(errors[0]);
      return;
    }

    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    setIsLoading(true);

    try {
      const response = await authClient.resetPassword(token, password);

      if (response.success) {
        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/auth/login');
        }, 3000);
      } else {
        setError(response.error || t('messages.error'));
      }
    } catch {
      setError(t('messages.error'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>{t('common.error')}</h1>
          </div>
          <div className="alert alert-error">{t('validation.passwordTooShort')}</div>
          <div className="auth-footer" style={{ marginTop: '1.5rem' }}>
            <Link to="/forgot-password" className="btn-primary">
              {t('auth.resetPassword')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>{t('auth.resetPassword')}</h1>
          <p>{t('auth.passwordReset')}</p>
        </div>

        {success ? (
          <div className="success-message">
            <div className="alert alert-success">
              <strong>✓ {t('auth.resetPasswordSuccess')}</strong>
              <p>{t('auth.resetPasswordSuccess')}</p>
              <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>{t('common.loading')}</p>
            </div>

            <div className="auth-footer" style={{ marginTop: '1.5rem' }}>
              <Link to="/login" className="btn-primary">
                {t('auth.login')}
              </Link>
            </div>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="password">{t('common.password')}</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  required
                  autoComplete="new-password"
                />
                {validationErrors.length > 0 && password && (
                  <div className="password-requirements">
                    <small>{t('validation.required')}:</small>
                    <ul>
                      {validationErrors.map((err, idx) => (
                        <li key={idx} className="requirement-error">
                          {err}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">{t('common.confirmPassword')}</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  required
                  autoComplete="new-password"
                />
              </div>

              {error && <div className="alert alert-error">{error}</div>}

              <button
                type="submit"
                disabled={isLoading || validationErrors.length > 0}
                className="btn-primary"
              >
                {isLoading ? t('common.loading') : t('auth.resetPassword')}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                {t('auth.alreadyHaveAccount')}{' '}
                <Link to="/login" className="link">
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
