import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './ErrorPage.css';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="error-page">
      <div className="error-container">
        <div className="error-icon error-404">
          <svg
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="11" cy="11" r="7" stroke="#722f37" strokeWidth="2" />
            <path d="M16 16L21 21" stroke="#722f37" strokeWidth="2" strokeLinecap="round" />
            <path d="M11 8V11L13 13" stroke="#722f37" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <h1>{t('error.notFound')}</h1>
        <p className="error-message">{t('error.notFoundMessage')}</p>
        <div className="error-buttons">
          <button className="error-button" onClick={() => navigate('/')}>
            {t('common.home')}
          </button>
          <button className="error-button error-button-secondary" onClick={() => navigate(-1)}>
            {t('common.goBack')}
          </button>
        </div>
      </div>
    </div>
  );
}
