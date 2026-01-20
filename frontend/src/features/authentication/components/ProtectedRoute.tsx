import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[];
}

/**
 * Protected route component that requires authentication and optionally specific roles
 * @param children - Component to render if authorized
 * @param requiredRoles - Array of roles required to access this route (e.g., ['ADMIN'])
 *                        If not provided, any authenticated user can access
 *                        User needs at least one of the provided roles
 */
export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // If role is required and user is not authenticated, show permission denied
  if (requiredRoles && requiredRoles.length > 0) {
    if (!isAuthenticated || !user) {
      return <Navigate to="/error/permission-denied" replace />;
    }

    // Check if user has required role(s)
    // First check the role field, then fallback to employeeType for employees
    let userRole = user.role?.toUpperCase();
    if (!userRole || userRole === 'EMPLOYEE') {
      // For employees, use employeeType instead
      userRole = user.employeeType?.toUpperCase() || '';
    }

    const hasRequiredRole = userRole && requiredRoles.some(
      role => userRole === role.toUpperCase()
    );

    console.log('ProtectedRoute check:', { userRole, requiredRoles, hasRequiredRole, userObject: user });

    if (!hasRequiredRole) {
      // User is authenticated but doesn't have required role
      return <Navigate to="/error/permission-denied" replace />;
    }
  } else {
    // No role required, just check authentication
    if (!isAuthenticated || !user) {
      return <Navigate to="/auth/login" replace />;
    }
  }

  return <>{children}</>;
}

/**
 * Public route component that redirects to home if already authenticated
 */
interface PublicRouteProps {
  children: ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
