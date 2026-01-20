import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './ErrorPage.css';

export default function SessionExpiredPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    // Auto-redirect after 5 seconds
    const timer = setTimeout(() => {
      navigate('/auth/login');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="error-page">
      <div className="error-container">
        <div className="error-icon error-401">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="#722f37" strokeWidth="2"/>
            <path d="M12 6V12L16 14" stroke="#722f37" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <h1>{t('error.sessionExpired')}</h1>
        <p className="error-message">
          {t('error.sessionExpiredMessage')}
        </p>
        <p className="error-redirect">
          {t('error.redirecting')}
        </p>
        <button 
          className="error-button"
          onClick={() => navigate('/auth/login')}
        >
          {t('common.login')}
        </button>
      </div>
    </div>
  );
}
