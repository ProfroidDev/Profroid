import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './ErrorPage.css';

export default function PermissionDeniedPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="error-page">
      <div className="error-container">
        <div className="error-icon error-403">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="5" y="11" width="14" height="10" rx="2" stroke="#722f37" strokeWidth="2"/>
            <path d="M7 11V7C7 4.79086 8.79086 3 11 3H13C15.2091 3 17 4.79086 17 7V11" stroke="#722f37" strokeWidth="2"/>
            <circle cx="12" cy="16" r="1.5" fill="#722f37"/>
          </svg>
        </div>
        <h1>{t('error.permissionDenied')}</h1>
        <p className="error-message">
          {t('error.permissionDeniedMessage')}
        </p>
        <div className="error-buttons">
          <button 
            className="error-button"
            onClick={() => navigate('/')}
          >
            {t('common.home')}
          </button>
          <button 
            className="error-button error-button-secondary"
            onClick={goBack}
          >
            {t('common.goBack')}
          </button>
        </div>
      </div>
    </div>
  );
}
