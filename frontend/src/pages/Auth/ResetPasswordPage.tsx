import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import authClient from '../../features/authentication/api/authClient';
import '../Auth.css';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset link.');
    }
  }, [token]);

  const validatePassword = (pwd: string): string[] => {
    const errors: string[] = [];
    
    if (pwd.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(pwd)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[0-9]/.test(pwd)) {
      errors.push('Password must contain at least one number');
    }
    
    return errors;
  };

  const handlePasswordChange = (pwd: string) => {
    setPassword(pwd);
    if (pwd) {
      const errors = validatePassword(pwd);
      setValidationErrors(errors);
    } else {
      setValidationErrors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Invalid reset token');
      return;
    }

    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    // Validate password
    const errors = validatePassword(password);
    if (errors.length > 0) {
      setError(errors[0]);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authClient.resetPassword(token, password);
      
      if (response.success) {
        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(response.error || 'Failed to reset password. Please try again.');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Invalid Reset Link</h1>
          </div>
          <div className="alert alert-error">
            The password reset link is invalid or has expired.
          </div>
          <div className="auth-footer" style={{ marginTop: '1.5rem' }}>
            <Link to="/forgot-password" className="btn-primary">
              Request New Reset Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Reset Password</h1>
          <p>Enter your new password</p>
        </div>

        {success ? (
          <div className="success-message">
            <div className="alert alert-success">
              <strong>✓ Password Reset Successfully!</strong>
              <p>
                Your password has been changed. You can now sign in with your new password.
              </p>
              <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                Redirecting to login page...
              </p>
            </div>
            
            <div className="auth-footer" style={{ marginTop: '1.5rem' }}>
              <Link to="/login" className="btn-primary">
                Go to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="password">New Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  required
                />
                {validationErrors.length > 0 && password && (
                  <div className="password-requirements">
                    <small>Password requirements:</small>
                    <ul>
                      {validationErrors.map((err, idx) => (
                        <li key={idx} className="requirement-error">{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
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

              {error && (
                <div className="alert alert-error">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || validationErrors.length > 0}
                className="btn-primary"
              >
                {isLoading ? 'Resetting Password...' : 'Reset Password'}
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
