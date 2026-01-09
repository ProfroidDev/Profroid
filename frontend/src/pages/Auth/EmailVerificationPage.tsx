import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './EmailVerificationPage.css';
import authClient from '../../features/authentication/api/authClient';

export default function EmailVerificationPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resendDisabled, setResendDisabled] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [verified, setVerified] = useState(false);

  // Get email from URL or state
  useEffect(() => {
    const token = searchParams.get('token');
    const emailFromUrl = searchParams.get('email');
    const state = location.state as { email?: string; userId?: string } | null;
    
    if (emailFromUrl) {
      setEmail(emailFromUrl);
    } else if (state?.email) {
      setEmail(state.email);
    } else {
      // If no email provided, redirect to register
      navigate('/auth/register');
    }

    // Auto-verify if token is in URL
    if (token) {
      const verifyHandler = async (tkn: string) => {
        setLoading(true);
        setError('');
        try {
          const response = await authClient.verifyEmail(tkn);
          if (response.success) {
            setVerified(true);
            setMessage(t('auth.emailVerificationSuccess'));
            // Redirect to profile completion after 2 seconds
            setTimeout(() => {
              navigate('/auth/register', { 
                state: { 
                  completionMode: true, 
                  userId: response.userId,
                  email: emailFromUrl || state?.email
                } 
              });
            }, 2000);
          } else {
            setError(response.error || t('auth.verificationFailed'));
          }
        } catch {
          setError(t('auth.verificationError'));
        } finally {
          setLoading(false);
        }
      };
      verifyHandler(token);
    }
  }, [searchParams, location.state, navigate, t]);

  // Handle resend countdown
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setResendDisabled(false);
    }
  }, [resendCountdown]);

  const verifyToken = async (token: string) => {
    setLoading(true);
    setError('');
    try {
      const response = await authClient.verifyEmail(token);
      if (response.success) {
        setVerified(true);
        setMessage(t('auth.emailVerificationSuccess'));
        // Redirect to profile completion after 2 seconds
        setTimeout(() => {
          navigate('/auth/register', { 
            state: { 
              completionMode: true, 
              userId: response.userId,
              email: email 
            } 
          });
        }, 2000);
      } else {
        setError(response.error || t('auth.verificationFailed'));
      }
    } catch {
      setError(t('auth.verificationError'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim()) {
      setError(t('validation.required'));
      return;
    }

    await verifyToken(verificationCode.trim());
  };

  const handleResend = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const response = await authClient.resendVerificationEmail(email);
      if (response.success) {
        setMessage(t('auth.verificationEmailResent'));
        setVerificationCode('');
        setResendDisabled(true);
        setResendCountdown(60);
      } else {
        setError(response.error || t('auth.resendFailed'));
      }
    } catch {
      setError(t('auth.resendError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>{t('auth.verifyEmail')}</h1>
        <p className="auth-subtitle">{t('auth.verifyEmailDescription', { email })}</p>

        {verified ? (
          <div className="success-message">
            <span className="success-icon">✓</span>
            <p>{message}</p>
            <p className="redirect-text">{t('auth.redirectingToProfile')}</p>
          </div>
        ) : (
          <>
            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleVerify} className="auth-form">
              <div className="form-group">
                <label htmlFor="code">{t('auth.verificationCode')}</label>
                <input
                  id="code"
                  type="text"
                  placeholder={t('auth.enterVerificationCode')}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  disabled={loading}
                  className="form-input"
                />
                <p className="input-hint">{t('auth.verificationCodeHint')}</p>
              </div>

              <button
                type="submit"
                disabled={loading || !verificationCode.trim()}
                className="btn btn-primary"
              >
                {loading ? t('common.verifying') : t('auth.verifyEmail')}
              </button>
            </form>

            <div className="verification-actions">
              <button
                onClick={handleResend}
                disabled={resendDisabled || loading}
                className="btn btn-link"
              >
                {resendDisabled
                  ? `${t('auth.resendIn')} ${resendCountdown}s`
                  : t('auth.resendCode')}
              </button>
              <button
                onClick={() => navigate('/auth/login')}
                disabled={loading}
                className="btn btn-secondary"
              >
                {t('auth.backToLogin')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
