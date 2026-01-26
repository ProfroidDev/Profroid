import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './BillingResult.css';

export default function BillingCancelPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const billId = useMemo(() => params.get('billId') ?? params.get('billd'), [params]);

  return (
    <div className="billing-result-container">
      <div className="billing-result-card">
        <div className="billing-result-icon cancel">!</div>

        <h1 className="billing-result-title">Payment cancelled</h1>
        <p className="billing-result-subtitle">
          Your payment was not completed. No charges were made.
        </p>

        {billId && (
          <div className="billing-result-info">
            <p>
              <strong>Bill:</strong> {billId}
            </p>
          </div>
        )}

        <div className="billing-result-actions">
          <button
            type="button"
            className="billing-result-btn primary"
            onClick={() => navigate('/my-bills')}
          >
            Back to My Bills
          </button>

          <button
            type="button"
            className="billing-result-btn secondary"
            onClick={() => navigate(-1)}
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
