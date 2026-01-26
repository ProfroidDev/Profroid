import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import './i18n/config';

import CustomerListPage from './pages/Customer/CustomerListPage';
import CustomerBills from './pages/Customer/CustomerBills';
import ServicesPage from './pages/jobs/ServicesPage';
import Navigation from './shared/components/Navigation';
import Footer from './shared/components/Footer';
import EmployeeListPage from './pages/Employee/EmployeeListPage';
import PartsPage from './pages/Parts/PartsPage';
import Inventory from './pages/Parts/Inventory';
import ServiceReports from './pages/Reports/ServiceReports';
import MyAppointmentsPage from './pages/Appointment/MyAppointmentsPage';
import MyJobsPage from './pages/Appointment/MyJobsPage';
import HomePage from './pages/Home/HomePage';
import ForbiddenPage from './pages/Error/ForbiddenPage';
import AboutPage from './pages/About/AboutPage';
import ContactPage from './pages/Contact/ContactPage';
import PrivacyPolicyPage from './pages/Privacy/PrivacyPolicyPage';

// Auth pages and components
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import ProfilePage from './pages/Auth/ProfilePage';
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/Auth/ResetPasswordPage';
import EmailVerificationPage from './pages/Auth/EmailVerificationPage';
import { ProtectedRoute, PublicRoute } from './features/authentication/components/ProtectedRoute';
import useAuthStore from './features/authentication/store/authStore';
import SessionExpiredPage from './pages/SessionExpiredPage';
import PermissionDeniedPage from './pages/PermissionDeniedPage';
import NotFoundPage from './pages/NotFoundPage';

// Payment Pages
import BillingSuccessPage from './pages/Billing/BillingSuccessPage';
import BillingCancelPage from './pages/Billing/BillingCancelPage';

function AppRoutes(): React.ReactElement {
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <>
      <Navigation />

      <Routes>
        {/* Error Routes */}
        <Route path="/error/forbidden" element={<ForbiddenPage />} />
        <Route path="/error/session-expired" element={<SessionExpiredPage />} />
        <Route path="/error/permission-denied" element={<PermissionDeniedPage />} />

        {/* Public Auth Routes */}
        <Route
          path="/auth/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/auth/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />
        <Route
          path="/auth/forgot-password"
          element={
            <PublicRoute>
              <ForgotPasswordPage />
            </PublicRoute>
          }
        />
        <Route
          path="/auth/reset-password"
          element={
            <PublicRoute>
              <ResetPasswordPage />
            </PublicRoute>
          }
        />
        {/* Backward compatibility: old reset-password links without /auth/ */}
        <Route
          path="/reset-password"
          element={
            <PublicRoute>
              <ResetPasswordPage />
            </PublicRoute>
          }
        />
        <Route
          path="/auth/verify-email"
          element={
            <PublicRoute>
              <EmailVerificationPage />
            </PublicRoute>
          }
        />

        {/* Public Pages */}
        <Route path="/" element={<HomePage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />

        {/* Payment return pages (Stripe hosted checkout redirects here) */}
        <Route
          path="/billing/success"
          element={
            <ProtectedRoute requiredRoles={['CUSTOMER']}>
              <BillingSuccessPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/billing/cancel"
          element={
            <ProtectedRoute requiredRoles={['CUSTOMER']}>
              <BillingCancelPage />
            </ProtectedRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Parts - ADMIN only */}
        <Route
          path="/parts"
          element={
            <ProtectedRoute requiredRoles={['ADMIN']}>
              <PartsPage />
            </ProtectedRoute>
          }
        />

        {/* Customers - ADMIN only */}
        <Route
          path="/customers"
          element={
            <ProtectedRoute requiredRoles={['ADMIN']}>
              <CustomerListPage />
            </ProtectedRoute>
          }
        />

        {/* Inventory - ADMIN only */}
        <Route
          path="/inventory"
          element={
            <ProtectedRoute requiredRoles={['ADMIN']}>
              <Inventory />
            </ProtectedRoute>
          }
        />

        {/* Service Reports - ADMIN and TECHNICIAN */}
        <Route
          path="/service-reports"
          element={
            <ProtectedRoute requiredRoles={['ADMIN', 'TECHNICIAN']}>
              <ServiceReports />
            </ProtectedRoute>
          }
        />

        {/* Employees - ADMIN only */}
        <Route
          path="/employees"
          element={
            <ProtectedRoute requiredRoles={['ADMIN']}>
              <EmployeeListPage />
            </ProtectedRoute>
          }
        />

        {/* My Appointments - CUSTOMER only */}
        <Route
          path="/my-appointments"
          element={
            <ProtectedRoute requiredRoles={['CUSTOMER']}>
              <MyAppointmentsPage />
            </ProtectedRoute>
          }
        />

        {/* Bills - CUSTOMER only */}
        <Route
          path="/my-bills"
          element={
            <ProtectedRoute requiredRoles={['CUSTOMER']}>
              <CustomerBills />
            </ProtectedRoute>
          }
        />

        {/* My Jobs - TECHNICIAN only */}
        <Route
          path="/my-jobs"
          element={
            <ProtectedRoute requiredRoles={['TECHNICIAN']}>
              <MyJobsPage />
            </ProtectedRoute>
          }
        />

        {/* 404 Not Found - Catch all unmatched routes */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      <Footer />
    </>
  );
}

function App(): React.ReactElement {
  return <AppRoutes />;
}

export default App;
