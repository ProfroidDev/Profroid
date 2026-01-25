import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

  const billId = useMemo(() => params.get('billId') ?? params.get('billd'), [params]);

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

        <h1 className="billing-result-title">Payment successful</h1>
        <p className="billing-result-subtitle">
          Thank you! Your payment has been received.
        </p>

        {loading && <p className="billing-result-subtitle">Loading your bill…</p>}

        {!loading && error && (
          <>
            <p className="billing-result-processing">{error}</p>

            <div className="billing-result-actions">
              <button
                type="button"
                className="billing-result-btn primary"
                onClick={() => navigate('/my-bills')}
              >
                Go to My Bills
              </button>

              <button
                type="button"
                className="billing-result-btn secondary"
                onClick={() => navigate('/')}
              >
                Home
              </button>
            </div>
          </>
        )}

        {!loading && !error && bill && (
          <>
            <div className="billing-result-info">
              <p>
                <strong>Bill:</strong> {bill.billId}
              </p>
              <p>
                <strong>Status:</strong> {bill.status}
              </p>

              {bill.status !== 'PAID' && (
                <p className="billing-result-processing">
                  Payment is processing. Refresh in a few seconds if it still shows unpaid.
                </p>
              )}
            </div>

            <div className="billing-result-actions">
              <button
                type="button"
                className="billing-result-btn primary"
                onClick={() => navigate('/my-bills')}
              >
                Go to My Bills
              </button>

              <button
                type="button"
                className="billing-result-btn secondary"
                onClick={() => navigate('/')}
              >
                Home
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
