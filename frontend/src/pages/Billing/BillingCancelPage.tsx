import { useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './BillingResult.css';

export default function BillingCancelPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const billId = useMemo(() => params.get('billId') ?? params.get('billd'), [params]);
  const locale = useMemo(() => params.get('locale'), [params]);

  // Restore language preference from URL
  useEffect(() => {
    if (locale && (locale === 'fr' || locale === 'en')) {
      i18n.changeLanguage(locale);
    }
  }, [locale, i18n]);

  return (
    <div className="billing-result-container">
      <div className="billing-result-card">
        <div className="billing-result-icon cancel">!</div>

        <h1 className="billing-result-title">{t('pages.billing.cancel.title')}</h1>
        <p className="billing-result-subtitle">{t('pages.billing.cancel.subtitle')}</p>

        {billId && (
          <div className="billing-result-info">
            <p>
              <strong>{t('pages.billing.cancel.billLabel')}:</strong> {billId}
            </p>
          </div>
        )}

        <div className="billing-result-actions">
          <button
            type="button"
            className="billing-result-btn primary"
            onClick={() => navigate('/my-bills')}
          >
            {t('pages.billing.cancel.backToMyBills')}
          </button>

          <button
            type="button"
            className="billing-result-btn secondary"
            onClick={() => navigate(-1)}
          >
            {t('pages.billing.cancel.goBack')}
          </button>
        </div>
      </div>
    </div>
  );
}
