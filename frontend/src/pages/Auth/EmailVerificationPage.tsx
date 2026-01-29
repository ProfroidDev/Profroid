import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './EmailVerificationPage.css';
import authClient from '../../features/authentication/api/authClient';
import { sanitizeEmail, sanitizeInput } from '../../utils/sanitizer';

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
    const rawToken = searchParams.get('token');
    const token = rawToken ? sanitizeInput(rawToken) : null;
    const emailFromUrl = searchParams.get('email') ? sanitizeEmail(searchParams.get('email')!) : '';
    const state = location.state as { email?: string; userId?: string } | null;

    // Try to get email from multiple sources: URL > state > sessionStorage
    const emailToUse =
      emailFromUrl || (state?.email ? sanitizeEmail(state.email) : '') || sessionStorage.getItem('verificationEmail') || '';

    if (emailToUse) {
      setEmail(emailToUse);
      // Clear sessionStorage once we have the email
      sessionStorage.removeItem('verificationEmail');
    }
    // Don't redirect if we have a token - let it auto-verify

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
            // Wait a moment to show loading overlay, then redirect
            setTimeout(() => {
              // Store data in sessionStorage for RegisterPage to access
              sessionStorage.setItem(
                'verificationData',
                JSON.stringify({
                  completionMode: true,
                  userId: response.userId,
                  email: emailFromUrl,
                })
              );
              // Close current tab/window if it was opened by email link
              if (window.opener) {
                window.close();
              } else {
                // Otherwise navigate normally
                navigate('/auth/register', {
                  state: {
                    completionMode: true,
                    userId: response.userId,
                    email: emailFromUrl,
                  },
                });
              }
            }, 500);
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
    } else if (!emailToUse && !token) {
      // Only redirect to register if NO token AND NO email from any source
      navigate('/auth/register');
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
        // Check if already verified
        if (response.message && response.message.includes('already verified')) {
          setError(t('auth.emailAlreadyVerified') || 'Email is already verified');
          setLoading(false);
          return;
        }
        setVerified(true);
        setMessage(t('auth.emailVerificationSuccess'));
        // Wait a moment to show loading overlay, then redirect
        setTimeout(() => {
          // Store data in sessionStorage for RegisterPage to access
          sessionStorage.setItem(
            'verificationData',
            JSON.stringify({
              completionMode: true,
              userId: response.userId,
              email: email,
            })
          );
          // Close current tab/window if it was opened by email link
          if (window.opener) {
            window.close();
          } else {
            // Otherwise navigate normally
            navigate('/auth/register', {
              state: {
                completionMode: true,
                userId: response.userId,
                email: email,
              },
            });
          }
        }, 500);
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
    if (!email.trim()) {
      setError(t('validation.emailRequired') || 'Email is required');
      return;
    }

    // Sanitize verification code before sending
    const sanitizedCode = sanitizeInput(verificationCode.trim());
    if (!sanitizedCode) {
      setError('Invalid verification code format');
      return;
    }
    await verifyToken(sanitizedCode);
  };

  const handleResend = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    
    if (!email || !email.trim()) {
      setError(t('validation.emailRequired') || 'Email is required');
      setLoading(false);
      return;
    }

    try {
      // Email should already be sanitized from state
      const response = await authClient.resendVerificationEmail(email);
      if (response.success) {
        // Check if email was already verified
        if (response.message && response.message.includes('already verified')) {
          setError(
            t('auth.emailAlreadyVerified') || 'Email is already verified. Please proceed to login.'
          );
          setResendDisabled(true);
        } else {
          setMessage(t('auth.verificationEmailResent'));
          setVerificationCode('');
          setResendDisabled(true);
          setResendCountdown(60);
        }
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
      {verified && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}
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
                  onChange={(e) => setVerificationCode(sanitizeInput(e.target.value))}
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
            </div>
          </>
        )}
      </div>
    </div>
  );
}
