import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../features/authentication/store/authStore';
import '../Auth.css';

export default function OAuthCallbackPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { initializeAuth } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  const getErrorMessage = useCallback((errorCode: string): string => {
    switch (errorCode) {
      case 'google_auth_failed':
        return t('auth.googleAuthFailed');
      case 'no_user':
        return t('auth.oauthNoUser');
      case 'callback_failed':
        return t('auth.oauthCallbackFailed');
      default:
        return t('auth.oauthError');
    }
  }, [t]);

  useEffect(() => {
    const processOAuthCallback = async () => {
      // Check for error parameter
      const errorParam = searchParams.get('error');
      if (errorParam) {
        setError(getErrorMessage(errorParam));
        setTimeout(() => {
          navigate('/auth/login');
        }, 3000);
        return;
      }

      // Check for token parameter
      const token = searchParams.get('token');
      if (!token) {
        setError(t('auth.oauthNoToken'));
        setTimeout(() => {
          navigate('/auth/login');
        }, 3000);
        return;
      }

      try {
        // Store the token
        localStorage.setItem('authToken', token);

        // Initialize auth to load user data
        await initializeAuth();

        // Redirect to home page
        navigate('/', { replace: true });
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError(t('auth.oauthCallbackFailed'));
        setTimeout(() => {
          navigate('/auth/login');
        }, 3000);
      }
    };

    processOAuthCallback();
  }, [searchParams, navigate, initializeAuth, t, getErrorMessage]);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>{error ? t('common.error') : t('auth.processingLogin')}</h1>
        </div>

        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          {error ? (
            <>
              <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                {error}
              </div>
              <p style={{ color: '#666', fontSize: '0.9rem' }}>
                {t('auth.redirectingToLogin')}
              </p>
            </>
          ) : (
            <>
              <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
              <p style={{ color: '#666' }}>{t('auth.pleaseWait')}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
