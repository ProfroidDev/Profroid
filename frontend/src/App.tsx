import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import "./App.css";

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
import { ProtectedRoute, PublicRoute } from "./features/authentication/components/ProtectedRoute";
import useAuthStore from "./features/authentication/store/authStore";

function Home(): React.ReactElement {
  return (
    <div style={{ padding: 16 }}>
      <h1>Profroid</h1>
      <p>Welcome to the Profroid frontend.</p>
      <p>
        <Link to="/customers">View Customers</Link>
      </p>
      <p>
        <Link to="/services">View Services</Link>
      </p>
    </div>
  );
}

function App(): React.ReactElement {
  const { fetchUser } = useAuthStore();

  useEffect(() => {
    // Fetch user session on app load if authenticated
    fetchUser();
  }, [fetchUser]);

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

        {/* Protected Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/parts" element={<PartsPage />} />
        <Route path="/customers" element={<CustomerListPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/employees" element={<EmployeeListPage />} />
        <Route path="/my-appointments" element={<MyAppointmentsPage />} />
        <Route path="/my-jobs" element={<MyJobsPage />} />
      </Routes>

      <Footer />
    </BrowserRouter>
  );
}

export default App;
