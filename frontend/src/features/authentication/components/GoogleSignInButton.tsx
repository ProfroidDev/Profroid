import { useTranslation } from 'react-i18next';

interface GoogleSignInButtonProps {
  className?: string;
  disabled?: boolean;
}

export default function GoogleSignInButton({ className = '', disabled = false }: GoogleSignInButtonProps) {
  const { t } = useTranslation();

  const handleGoogleSignIn = () => {
    const authServiceUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/auth';
    // Redirect to backend Google OAuth endpoint
    window.location.href = `${authServiceUrl}/google`;
  };

  return (
    <button
      onClick={handleGoogleSignIn}
      disabled={disabled}
      className={`google-signin-btn ${className}`}
      type="button"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        width: '100%',
        padding: '0.75rem 1rem',
        border: '1px solid #dadce0',
        borderRadius: '4px',
        backgroundColor: 'white',
        color: '#3c4043',
        fontSize: '0.95rem',
        fontWeight: '500',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        opacity: disabled ? 0.6 : 1,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = '#f8f9fa';
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'white';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      <span>{t('auth.signInWithGoogle')}</span>
    </button>
  );
}
