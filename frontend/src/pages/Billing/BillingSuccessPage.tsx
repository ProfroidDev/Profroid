import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { AxiosError } from 'axios';
import axiosInstance from '../../shared/api/axiosInstance';
import './BillingResult.css';

type BillResponseModel = {
  billId: string;
  status: 'UNPAID' | 'PAID';
  amount: number;
};

type ApiErrorBody = {
  message?: string;
};

export default function BillingSuccessPage() {
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

  const [bill, setBill] = useState<BillResponseModel | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!billId) {
        if (isMounted) {
          setLoading(false);
          setError('Missing billId in URL.');
        }
        return;
      }

      try {
        if (isMounted) {
          setLoading(true);
          setError(null);
        }

        const res = await axiosInstance.get<BillResponseModel>(`/bills/${billId}`);
        if (isMounted) setBill(res.data);
      } catch (err) {
        const axiosErr = err as AxiosError<ApiErrorBody>;
        const msg = axiosErr.response?.data?.message ?? 'Failed to load bill.';
        if (isMounted) setError(msg);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [billId]);

  return (
    <div className="billing-result-container">
      <div className="billing-result-card">
        <div className="billing-result-icon success">✓</div>

        <h1 className="billing-result-title">{t('pages.billing.success.title')}</h1>
        <p className="billing-result-subtitle">{t('pages.billing.success.subtitle')}</p>

        {loading && <p className="billing-result-subtitle">{t('pages.billing.success.loading')}</p>}

        {!loading && error && (
          <>
            <p className="billing-result-processing">{error}</p>

            <div className="billing-result-actions">
              <button
                type="button"
                className="billing-result-btn primary"
                onClick={() => navigate('/my-bills')}
              >
                {t('pages.billing.success.goToMyBills')}
              </button>

              <button
                type="button"
                className="billing-result-btn secondary"
                onClick={() => navigate('/')}
              >
                {t('pages.billing.success.home')}
              </button>
            </div>
          </>
        )}

        {!loading && !error && bill && (
          <>
            <div className="billing-result-info">
              <p>
                <strong>{t('pages.billing.success.billLabel')}:</strong> {bill.billId}
              </p>
              <p>
                <strong>{t('pages.billing.success.statusLabel')}:</strong> {bill.status}
              </p>

              {bill.status !== 'PAID' && (
                <p className="billing-result-processing">{t('pages.billing.success.processing')}</p>
              )}
            </div>

            <div className="billing-result-actions">
              <button
                type="button"
                className="billing-result-btn primary"
                onClick={() => navigate('/my-bills')}
              >
                {t('pages.billing.success.goToMyBills')}
              </button>

              <button
                type="button"
                className="billing-result-btn secondary"
                onClick={() => navigate('/')}
              >
                {t('pages.billing.success.home')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
