import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuthStore, { type AuthUser } from '../../features/authentication/store/authStore';
import authClient from '../../features/authentication/api/authClient';
import GoogleSignInButton from '../../features/authentication/components/GoogleSignInButton';
import { getProvincePostalCodeError } from '../../utils/postalCodeValidator';
import '../Auth.css';

const provinces = ['Ontario (ON)', 'Quebec (QC)'];

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { error, isLoading, clearError, setUser, setAuthenticated, fetchCustomerData } =
    useAuthStore();
  const [step, setStep] = useState<1 | 2>(1);
  const [userId, setUserId] = useState('');

  // Clear auth error when RegisterPage loads
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Check if coming from login with requiresCompletion or from email verification
  useEffect(() => {
    const state = location.state as {
      completionMode?: boolean;
      userId?: string;
      email?: string;
    } | null;

    // First check location state (from navigate)
    if (state?.completionMode && state?.userId) {
      setUserId(state.userId);
      if (state.email) setEmail(state.email);
      setStep(2); // Go directly to customer form
    } else {
      // Fall back to sessionStorage (from closed window redirect)
      const verificationData = sessionStorage.getItem('verificationData');
      if (verificationData) {
        try {
          const data = JSON.parse(verificationData);
          if (data.completionMode && data.userId) {
            setUserId(data.userId);
            if (data.email) setEmail(data.email);
            setStep(2); // Go directly to customer form
            // Clear sessionStorage after reading
            sessionStorage.removeItem('verificationData');
          }
        } catch (e) {
          console.error('Failed to parse verification data:', e);
        }
      }
    }
  }, [location.state]);

  // Step 1: Email/Password
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2: Customer Data
  const [customerData, setCustomerData] = useState({
    firstName: '',
    lastName: '',
    streetAddress: '',
    city: '',
    province: provinces[0] || '',
    country: 'Canada',
    postalCode: '',
    phoneNumbers: [{ number: '', type: 'MOBILE' as const }],
  });

  const [formError, setFormError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const translateBackendMessage = (message: string | undefined | null): string => {
    if (!message) return t('messages.error');

    const lowerMessage = message.toLowerCase();

    // Map backend messages to translation keys
    if (lowerMessage.includes('complete') || lowerMessage.includes('registration')) {
      return t('auth.completeRegistration');
    }
    if (
      lowerMessage.includes('already') ||
      lowerMessage.includes('exists') ||
      lowerMessage.includes('user')
    ) {
      return t('auth.emailAlreadyExists');
    }

    return message; // Return original message if no translation found
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    clearError();

    if (!email || !password || !confirmPassword) {
      setFormError(t('common.required'));
      return;
    }

    if (password !== confirmPassword) {
      setFormError(t('auth.passwordMismatch'));
      return;
    }

    if (password.length < 6) {
      setFormError(t('validation.passwordTooShort'));
      return;
    }

    setSubmitting(true);
    try {
      const response = await authClient.register(email, password);
      if (response.success) {
        // Redirect to email verification page
        navigate('/auth/verify-email', {
          state: { email, userId: response.userId },
        });
      } else {
        setFormError(translateBackendMessage(response.error));
      }
    } catch (err) {
      setFormError(translateBackendMessage(err instanceof Error ? err.message : undefined));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCustomerInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setCustomerData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    if (name === 'postalCode') {
      // Extract province code from dropdown value like "Ontario (ON)"
      const provinceCode =
        (name === 'postalCode' ? customerData.province : value).match(/\(([A-Z]{2})\)/)?.[1] ||
        (name === 'postalCode' ? customerData.province : value);
      const errorKey = getProvincePostalCodeError(value, provinceCode);
      if (errorKey) {
        const translatedError = t(errorKey, { province: provinceCode });
        setErrors((prev) => ({ ...prev, postalCode: translatedError }));
      }
    }
  };

  const handlePhoneChange = (index: number, field: string, value: string) => {
    const newPhones = [...customerData.phoneNumbers];
    newPhones[index] = { ...newPhones[index], [field]: value };
    setCustomerData((prev) => ({ ...prev, phoneNumbers: newPhones }));
  };

  const addPhoneField = () => {
    setCustomerData((prev) => ({
      ...prev,
      phoneNumbers: [...prev.phoneNumbers, { number: '', type: 'MOBILE' as const }],
    }));
  };

  const removePhoneField = (index: number) => {
    setCustomerData((prev) => ({
      ...prev,
      phoneNumbers: prev.phoneNumbers.filter((_, i) => i !== index),
    }));
  };

  const validateCustomerForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!customerData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!customerData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!customerData.streetAddress.trim()) newErrors.streetAddress = 'Street address is required';
    if (!customerData.city.trim()) newErrors.city = 'City is required';
    if (!customerData.postalCode.trim()) newErrors.postalCode = 'Postal code is required';
    else {
      // Extract province code from dropdown value like "Ontario (ON)"
      const provinceCode =
        customerData.province.match(/\(([A-Z]{2})\)/)?.[1] || customerData.province;
      const postalErrorKey = getProvincePostalCodeError(customerData.postalCode, provinceCode);
      if (postalErrorKey) {
        newErrors.postalCode = t(postalErrorKey, { province: provinceCode });
      }
    }

    if (customerData.phoneNumbers.some((p) => !p.number.trim())) {
      newErrors.phoneNumbers = 'All phone numbers must be filled';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!validateCustomerForm()) return;

    setSubmitting(true);
    try {
      // Extract province code (ON or QC) from dropdown value like "Ontario (ON)" or "Quebec (QC)"
      const provinceCode =
        customerData.province.match(/\(([A-Z]{2})\)/)?.[1] || customerData.province;

      // Convert province code back to full name for backend
      const provinceMap: { [key: string]: string } = {
        ON: 'Ontario',
        QC: 'Quebec',
      };
      const provinceName = provinceMap[provinceCode] || provinceCode;

      // Format postal code: remove spaces, uppercase, then add space in correct position (A1A 1A1)
      const rawPostalCode = customerData.postalCode.toUpperCase().replace(/\s+/g, '');
      const formattedPostalCode =
        rawPostalCode.length === 6
          ? `${rawPostalCode.substring(0, 3)} ${rawPostalCode.substring(3)}`
          : rawPostalCode;

      // Complete registration - auth service will create customer record and activate user
      const response = await authClient.completeRegistration(userId, {
        ...customerData,
        province: provinceName,
        postalCode: formattedPostalCode,
      });

      if (response.success && response.token && response.user) {
        localStorage.setItem('authToken', response.token);
        setUser({
          ...response.user,
          role: response.user.role || 'customer',
          isActive: response.user.isActive ?? true,
        } as AuthUser);
        setAuthenticated(true);

        // Immediately load customer profile data so /profile has data without manual refresh
        // Pass userId directly since user might not be fully set in store yet
        await fetchCustomerData(response.user.id);

        navigate('/');
      } else {
        setFormError(translateBackendMessage(response.error));
      }
    } catch (err) {
      setFormError(translateBackendMessage(err instanceof Error ? err.message : undefined));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          {step === 2 && (
            <>
              <h2
                style={{
                  color: '#7a0901',
                  fontSize: '1.8rem',
                  fontWeight: '700',
                  marginBottom: '0.5rem',
                }}
              >
                {(location.state as { completionMode?: boolean } | null)?.completionMode
                  ? t('pages.profile.personalInfo')
                  : t('pages.profile.updateProfile')}
              </h2>
              <p style={{ color: '#999', marginTop: 0 }}>Step 2 of 2</p>
            </>
          )}
          {step === 1 && (
            <>
              <h1>{t('auth.register')}</h1>
              <p>{t('auth.signUpWith')}</p>
            </>
          )}
        </div>

        {step === 1 ? (
          <form onSubmit={handleStep1Submit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">{t('common.email')}</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.enterEmail')}
                disabled={submitting}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">{t('common.password')}</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">{t('common.confirmPassword')}</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                required
              />
            </div>

            {(formError || error) && (
              <div className="alert alert-error">{formError || translateBackendMessage(error)}</div>
            )}

            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? t('common.loading') : t('common.save')}
            </button>

            {/* Divider */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                margin: '1.5rem 0',
                gap: '1rem',
              }}
            >
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e0e0e0' }}></div>
              <span style={{ color: '#666', fontSize: '0.9rem' }}>{t('common.or')}</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e0e0e0' }}></div>
            </div>

            {/* Google Sign-Up Button */}
            <GoogleSignInButton disabled={submitting} />
          </form>
        ) : (
          <form onSubmit={handleStep2Submit} className="auth-form">
            <div className="form-group">
              <label htmlFor="firstName">{t('auth.firstName')} *</label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                value={customerData.firstName}
                onChange={handleCustomerInputChange}
                placeholder="John"
                disabled={submitting}
                required
              />
              {errors.firstName && <span className="field-error">{errors.firstName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="lastName">{t('auth.lastName')} *</label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                value={customerData.lastName}
                onChange={handleCustomerInputChange}
                placeholder="Doe"
                disabled={submitting}
                required
              />
              {errors.lastName && <span className="field-error">{errors.lastName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="streetAddress">{t('pages.customers.address')} *</label>
              <input
                id="streetAddress"
                name="streetAddress"
                type="text"
                value={customerData.streetAddress}
                onChange={handleCustomerInputChange}
                placeholder="123 Main St"
                disabled={submitting}
                required
              />
              {errors.streetAddress && <span className="field-error">{errors.streetAddress}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="city">{t('pages.customers.city')} *</label>
              <input
                id="city"
                name="city"
                type="text"
                value={customerData.city}
                onChange={handleCustomerInputChange}
                placeholder="Toronto"
                disabled={submitting}
                required
              />
              {errors.city && <span className="field-error">{errors.city}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="province">{t('pages.customers.province')} *</label>
              <select
                id="province"
                name="province"
                value={customerData.province}
                onChange={handleCustomerInputChange}
                disabled={submitting}
                required
              >
                {provinces.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="postalCode">{t('pages.customers.postalCode')} *</label>
              <input
                id="postalCode"
                name="postalCode"
                type="text"
                value={customerData.postalCode}
                onChange={handleCustomerInputChange}
                placeholder="M5H 2N2"
                disabled={submitting}
                required
              />
              {errors.postalCode && <span className="field-error">{errors.postalCode}</span>}
            </div>

            <div className="form-group">
              <label>{t('auth.phone')} *</label>
              {customerData.phoneNumbers.map((phone, index) => (
                <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="tel"
                    value={phone.number}
                    onChange={(e) => handlePhoneChange(index, 'number', e.target.value)}
                    placeholder="123-456-7890"
                    disabled={submitting}
                    style={{ flex: 1 }}
                    required
                  />
                  <select
                    value={phone.type}
                    onChange={(e) => handlePhoneChange(index, 'type', e.target.value)}
                    disabled={submitting}
                    style={{ width: '120px' }}
                  >
                    <option value="MOBILE">Mobile</option>
                    <option value="HOME">Home</option>
                    <option value="WORK">Work</option>
                  </select>
                  {customerData.phoneNumbers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePhoneField(index)}
                      disabled={submitting}
                      className="btn-danger"
                      style={{ padding: '8px 12px' }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              {errors.phoneNumbers && <span className="field-error">{errors.phoneNumbers}</span>}
              <button
                type="button"
                onClick={addPhoneField}
                disabled={submitting}
                className="btn btn-secondary"
                style={{ marginTop: '8px' }}
              >
                + {t('pages.customers.phone')}
              </button>
            </div>

            {(formError || error) && (
              <div className="alert alert-error">{formError || translateBackendMessage(error)}</div>
            )}

            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? t('common.loading') : t('auth.createAccount')}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={submitting}
              className="btn btn-secondary"
              style={{ marginTop: '8px' }}
            >
              {t('common.back')}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <p>
            {t('auth.alreadyHaveAccount')}{' '}
            <Link to="/auth/login" className="link">
              {t('auth.login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
