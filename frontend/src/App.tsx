import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import "./App.css";
import "./i18n/config";

import CustomerListPage from "./pages/Customer/CustomerListPage";
import ServicesPage from "./pages/jobs/ServicesPage";
import Navigation from "./shared/components/Navigation";
import Footer from "./shared/components/Footer";
import EmployeeListPage from "./pages/Employee/EmployeeListPage";
import PartsPage from "./pages/Parts/PartsPage";
import MyAppointmentsPage from "./pages/Appointment/MyAppointmentsPage";
import MyJobsPage from "./pages/Appointment/MyJobsPage";
import HomePage from "./pages/Home/HomePage";
import ForbiddenPage from "./pages/Error/ForbiddenPage";

// Auth pages and components
import LoginPage from "./pages/Auth/LoginPage";
import RegisterPage from "./pages/Auth/RegisterPage";
import ProfilePage from "./pages/Auth/ProfilePage";
import ForgotPasswordPage from "./pages/Auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/Auth/ResetPasswordPage";
import EmailVerificationPage from "./pages/Auth/EmailVerificationPage";
import {
  ProtectedRoute,
  PublicRoute,
} from "./features/authentication/components/ProtectedRoute";
import useAuthStore from "./features/authentication/store/authStore";
import { useInitialize403Handler } from "./utils/403Handler";

function AppRoutes(): React.ReactElement {
  const { initializeAuth } = useAuthStore();
  useInitialize403Handler(); // Initialize 403 handler - now inside router context

  useEffect(() => {
    // Initialize auth and fetch user + customer data on app load
    initializeAuth();
  }, [initializeAuth]);

  return (
    <>
      <Navigation />

      <Routes>
        {/* Error Routes */}
        <Route path="/error/forbidden" element={<ForbiddenPage />} />

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

        {/* Protected Routes */}
        <Route path="/" element={<HomePage />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/parts"
          element={
            <ProtectedRoute requiredRole="admin">
              <PartsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers"
          element={
            <ProtectedRoute requiredRole="admin">
              <CustomerListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/services"
          element={<ServicesPage />}
        />
        <Route
          path="/employees"
          element={
            <ProtectedRoute requiredRole="admin">
              <EmployeeListPage />
            </ProtectedRoute>
          }
        />
        <Route path="/my-appointments" element={<MyAppointmentsPage />} />
        <Route
          path="/my-jobs"
          element={
            <ProtectedRoute requiredEmployeeType="TECHNICIAN">
              <MyJobsPage />
            </ProtectedRoute>
          }
        />
      </Routes>

      <Footer />
    </>
  );
}

function App(): React.ReactElement {
  return (
    <AppRoutes />
  );
}

export default App;
