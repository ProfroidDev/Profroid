import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../features/authentication/store/authStore';
import authClient from '../../features/authentication/api/authClient';
import GoogleSignInButton from '../../features/authentication/components/GoogleSignInButton';
import { sanitizeEmail, validateAndSanitizeEmail } from '../../utils/sanitizer';
import '../Auth.css';

// Helper to prevent dangerous patterns in non-password fields
function preventDangerousPatterns(value: string): string {
  // Block patterns: << >> -- '; DROP etc.
  return value.replace(/<<|>>|--|';|DROP|DELETE|INSERT|UPDATE|SELECT/gi, '');
}

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { error, isLoading, clearError, initializeAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');

  const handleEmailChange = (value: string) => {
    // Sanitize email as user types and block dangerous patterns
    let sanitized = sanitizeEmail(value);
    sanitized = preventDangerousPatterns(sanitized);
    setEmail(sanitized);
  };

  const handlePasswordChange = (value: string) => {
    // Allow passwords with ANY special characters (!@#$%^&*) - backend validates
    // Password can contain: letters, numbers, and special characters
    setPassword(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    clearError();

    if (!email || !password) {
      setFormError(t('common.required'));
      return;
    }

    // Validate and sanitize email before submission
    const emailValidation = validateAndSanitizeEmail(email);
    if (!emailValidation.isValid) {
      setFormError(emailValidation.error || t('validation.emailInvalid'));
      return;
    }

    // Final sanitization before sending to backend
    const sanitizedEmail = sanitizeEmail(email);
    // Do NOT sanitize password - backend will validate it

    // Call authClient directly to handle all response cases
    const response = await authClient.signIn(sanitizedEmail, password);

    if (response.success) {
      // Initialize auth to load user and customer data immediately
      await initializeAuth();
      navigate('/');
    } else if (
      response.requiresVerification ||
      (response.error && response.error.toLowerCase().includes('verify'))
    ) {
      // Email not verified - redirect to verification page
      // Store email in sessionStorage so it persists if user refreshes
      sessionStorage.setItem('verificationEmail', sanitizedEmail);
      navigate('/auth/verify-email', { state: { email: sanitizedEmail } });
    } else if ('requiresCompletion' in response && response.requiresCompletion) {
      // Profile not completed - redirect to complete profile
      navigate('/auth/register', {
        state: { completionMode: true, userId: response.userId, email: sanitizedEmail },
      });
    } else {
      // Show error
      setFormError(response.error || t('auth.loginFailed'));
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>{t('auth.login')}</h1>
          <p>{t('auth.signInWith')}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
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
              autoComplete="current-password"
            />
          </div>

          <div style={{ textAlign: 'right', marginTop: '-0.5rem', marginBottom: '0.5rem' }}>
            <Link to="/auth/forgot-password" className="link" style={{ fontSize: '0.9rem' }}>
              {t('auth.forgotPassword')}
            </Link>
          </div>

          {(formError || error) && (
            <div className="alert alert-error">
              {formError || 
               (error?.toLowerCase().includes('invalid') || error?.toLowerCase().includes('credentials') || error?.toLowerCase().includes('email') ? 
                t('auth.invalidCredentials') : 
                error)}
            </div>
          )}

          <button type="submit" disabled={isLoading} className="btn btn-primary">
            {isLoading ? t('common.loading') : t('auth.login')}
          </button>

          {/* Divider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              margin: '1.5rem 0',
              gap: '1rem',
            }}
          >
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e0e0e0' }}></div>
            <span style={{ color: '#666', fontSize: '0.9rem' }}>{t('common.or')}</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e0e0e0' }}></div>
          </div>

          {/* Google Sign-In Button */}
          <GoogleSignInButton disabled={isLoading} />
        </form>

        <div className="auth-footer">
          <p>
            {t('auth.noAccount')}{' '}
            <Link to="/auth/register" className="link">
              {t('auth.register')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
