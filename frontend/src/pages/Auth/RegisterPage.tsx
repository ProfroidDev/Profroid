import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import useAuthStore, { type AuthUser } from '../../features/authentication/store/authStore';
import authClient from '../../features/authentication/api/authClient';
import { getPostalCodeError } from '../../utils/postalCodeValidator';
import '../Auth.css';

const provinces = ['Ontario', 'Quebec', 'British Columbia', 'Alberta', 'Manitoba', 'Saskatchewan', 'Nova Scotia'];

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { error, isLoading, clearError, setUser, setAuthenticated, fetchCustomerData } = useAuthStore();
  const [step, setStep] = useState<1 | 2>(1);
  const [userId, setUserId] = useState('');
  
  // Check if coming from login with requiresCompletion
  useEffect(() => {
    const state = location.state as { completionMode?: boolean; userId?: string; email?: string } | null;
    if (state?.completionMode && state?.userId) {
      setUserId(state.userId);
      if (state.email) setEmail(state.email);
      setStep(2); // Go directly to customer form
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

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    clearError();

    if (!email || !password || !confirmPassword) {
      setFormError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);
    try {
      const response = await authClient.register(email, password);
      if (response.success && response.requiresCompletion && response.userId) {
        setUserId(response.userId);
        setStep(2);
      } else {
        setFormError(response.error || 'Registration failed');
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCustomerInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCustomerData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    if (name === 'postalCode') {
      const error = getPostalCodeError(value, customerData.city, customerData.province);
      if (error) setErrors(prev => ({ ...prev, postalCode: error }));
    }
  };

  const handlePhoneChange = (index: number, field: string, value: string) => {
    const newPhones = [...customerData.phoneNumbers];
    newPhones[index] = { ...newPhones[index], [field]: value };
    setCustomerData(prev => ({ ...prev, phoneNumbers: newPhones }));
  };

  const addPhoneField = () => {
    setCustomerData(prev => ({
      ...prev,
      phoneNumbers: [...prev.phoneNumbers, { number: '', type: 'MOBILE' as const }],
    }));
  };

  const removePhoneField = (index: number) => {
    setCustomerData(prev => ({
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
      const postalError = getPostalCodeError(customerData.postalCode, customerData.city, customerData.province);
      if (postalError) newErrors.postalCode = postalError;
    }
    
    if (customerData.phoneNumbers.some(p => !p.number.trim())) {
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
      // Complete registration - auth service will create customer record and activate user
      const response = await authClient.completeRegistration(userId, customerData);
      
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
        setFormError(response.error || 'Failed to complete registration');
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to complete registration');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>{step === 1 ? 'Create Account' : (location.state as { completionMode?: boolean } | null)?.completionMode ? 'Complete Your Registration' : 'Complete Your Profile'}</h1>
          <p>{step === 1 ? 'Join us today' : 'Step 2 of 2'}</p>
        </div>

        {step === 1 ? (
        <form onSubmit={handleStep1Submit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              disabled={submitting}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
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
            <label htmlFor="confirmPassword">Confirm Password</label>
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
            <div className="alert alert-error">
              {formError || error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary"
          >
            {submitting ? 'Creating account...' : 'Continue'}
          </button>
        </form>
        ) : (
        <form onSubmit={handleStep2Submit} className="auth-form">
          <div className="form-group">
            <label htmlFor="firstName">First Name *</label>
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
            <label htmlFor="lastName">Last Name *</label>
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
            <label htmlFor="streetAddress">Street Address *</label>
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
            <label htmlFor="city">City *</label>
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
            <label htmlFor="province">Province *</label>
            <select
              id="province"
              name="province"
              value={customerData.province}
              onChange={handleCustomerInputChange}
              disabled={submitting}
              required
            >
              {provinces.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="postalCode">Postal Code *</label>
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
            <label>Phone Numbers *</label>
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
              className="btn-secondary"
              style={{ marginTop: '8px' }}
            >
              + Add Phone
            </button>
          </div>

          {(formError || error) && (
            <div className="alert alert-error">
              {formError || error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary"
          >
            {submitting ? 'Completing...' : 'Complete Registration'}
          </button>
          
          <button
            type="button"
            onClick={() => setStep(1)}
            disabled={submitting}
            className="btn-secondary"
            style={{ marginTop: '8px' }}
          >
            Back
          </button>
        </form>
        )}

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
