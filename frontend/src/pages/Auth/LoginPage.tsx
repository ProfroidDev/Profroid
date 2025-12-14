import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../features/authentication/store/authStore';
import authClient from '../../features/authentication/api/authClient';
import '../Auth.css';

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { error, isLoading, clearError, login, fetchCustomerData } = useAuthStore();
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

    // Use store's login action which updates auth state
    const success = await login(email, password);
    
    if (success) {
      // Ensure customer/employee data is loaded before routing
      await fetchCustomerData();
      navigate('/');
    } else {
      // Check if requiresCompletion by calling authClient directly for registration flow
      const response = await authClient.signIn(email, password);
      if (response.requiresCompletion && response.userId) {
        navigate('/register', { state: { completionMode: true, userId: response.userId, email } });
      }
      // If neither, error is already in store and will display below
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
            <Link to="/forgot-password" className="link" style={{ fontSize: '0.9rem' }}>
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
            className="btn-primary"
          >
            {isLoading ? t('common.loading') : t('auth.login')}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="link">
              {t('auth.register')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
