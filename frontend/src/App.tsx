import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
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

// Auth pages and components
import LoginPage from "./pages/Auth/LoginPage";
import RegisterPage from "./pages/Auth/RegisterPage";
import ProfilePage from "./pages/Auth/ProfilePage";
import ForgotPasswordPage from "./pages/Auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/Auth/ResetPasswordPage";
import { ProtectedRoute, PublicRoute } from "./features/authentication/components/ProtectedRoute";
import useAuthStore from "./features/authentication/store/authStore";
import { useTranslation } from "react-i18next";

function Home(): React.ReactElement {
  const { t } = useTranslation();

  return (
    <div style={{ padding: 16 }}>
      <h1>{t('common.appName')}</h1>
      <p>{t('common.welcome')}</p>
      <p>
        <Link to="/customers">{t('pages.home.viewCustomers')}</Link>
      </p>
      <p>
        <Link to="/services">{t('pages.home.viewServices')}</Link>
      </p>
    </div>
  );
}

function App(): React.ReactElement {
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    // Initialize auth and fetch user + customer data on app load
    initializeAuth();
  }, [initializeAuth]);

  return (
    <BrowserRouter>
      <Navigation />

      <Routes>
        {/* Public Auth Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPasswordPage />
            </PublicRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PublicRoute>
              <ResetPasswordPage />
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/parts" element={<PartsPage />} />
        <Route path="/customers" element={<CustomerListPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/employees" element={<ProtectedRoute requiredRole="admin"><EmployeeListPage /></ProtectedRoute>} />
        <Route path="/my-appointments" element={<MyAppointmentsPage />} />
        <Route path="/my-jobs" element={<ProtectedRoute requiredEmployeeType="TECHNICIAN"><MyJobsPage /></ProtectedRoute>} />
      </Routes>

      <Footer />
    </BrowserRouter>
  );
}

export default App;
