import { useState } from 'react';
import { Link } from 'react-router-dom';
import authClient from '../../features/authentication/api/authClient';
import '../Auth.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authClient.forgotPassword(email);
      
      if (response.success) {
        setSuccess(true);
        setEmail(''); // Clear the form
      } else {
        setError(response.error || 'Failed to send reset email. Please try again.');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Forgot Password?</h1>
          <p>Enter your email to receive a password reset link</p>
        </div>

        {success ? (
          <div className="success-message">
            <div className="alert alert-success">
              <strong>✓ Check your email!</strong>
              <p>
                If an account exists with that email address, you'll receive a password reset link shortly.
              </p>
              <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                Please check your spam folder if you don't see the email within a few minutes.
              </p>
            </div>
            
            <div className="auth-footer" style={{ marginTop: '1.5rem' }}>
              <Link to="/login" className="btn-secondary">
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  disabled={isLoading}
                  required
                />
              </div>

              {error && (
                <div className="alert alert-error">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary"
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                Remember your password?{' '}
                <Link to="/login" className="link">
                  Sign in
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
