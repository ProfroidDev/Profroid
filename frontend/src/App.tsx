import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import "./App.css";

import CustomerListPage from "./pages/Customer/CustomerListPage";
import ServicesPage from "./pages/Jobs/ServicesPage";
import Navigation from "./shared/components/Navigation";
import Footer from "./shared/components/Footer";
import EmployeeSchedulePage from "./pages/Employee/EmployeeSchedulePage";
import EmployeeListPage from "./pages/Employee/EmployeeListPage";
import PartsPage from "./pages/Parts/PartsPage";

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
  return (
    <BrowserRouter>
      <Navigation />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/parts" element={<PartsPage />} />
        <Route path="/customers" element={<CustomerListPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/employees" element={<EmployeeListPage />} />
        <Route
          path="/employees/schedule"
          element={<EmployeeSchedulePage />}
        />
      </Routes>

      <Footer />
    </BrowserRouter>
  );
}

export default App;
