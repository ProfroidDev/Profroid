import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../features/authentication/store/authStore';
import authClient from '../../features/authentication/api/authClient';
import '../Auth.css';

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { error, isLoading, clearError, initializeAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    clearError();

    if (!email || !password) {
      setFormError(t('common.required'));
      return;
    }

    // Call authClient directly to handle all response cases
    const response = await authClient.signIn(email, password);
    
    if (response.success) {
      // Initialize auth to load user and customer data immediately
      await initializeAuth();
      navigate('/');
    } else if (response.requiresVerification || (response.error && response.error.toLowerCase().includes('verify'))) {
      // Email not verified - redirect to verification page
      // Store email in sessionStorage so it persists if user refreshes
      sessionStorage.setItem('verificationEmail', email);
      navigate('/auth/verify-email', { state: { email } });
    } else if ('requiresCompletion' in response && response.requiresCompletion) {
      // Profile not completed - redirect to complete profile
      navigate('/auth/register', { state: { completionMode: true, userId: response.userId, email } });
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
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.enterEmail')}
              disabled={isLoading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('common.password')}</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
              required
            />
          </div>

          <div style={{ textAlign: 'right', marginTop: '-0.5rem', marginBottom: '0.5rem' }}>
            <Link to="/auth/forgot-password" className="link" style={{ fontSize: '0.9rem' }}>
              {t('auth.forgotPassword')}
            </Link>
          </div>

          {(formError || error) && (
            <div className="alert alert-error">
              {formError || error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
          >
            {isLoading ? t('common.loading') : t('auth.login')}
          </button>
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
