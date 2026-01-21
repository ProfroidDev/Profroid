import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// This will be set globally when the app mounts
let navigationCallback: ((path: string) => void) | null = null;

/**
 * Hook to initialize navigation for 403 error handling
 * Call this in App.tsx at the top level
 */
export const useInitialize403Handler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigationCallback = (path: string) => navigate(path);
    return () => {
      navigationCallback = null;
    };
  }, [navigate]);
};

/**
 * Function to be called from the axios interceptor
 * Redirects to 403 page when a 403 error is encountered
 */
export const handle403Redirect = () => {
  if (navigationCallback) {
    navigationCallback('/error/forbidden');
  }
};
