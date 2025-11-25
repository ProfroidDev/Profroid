import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";

import Navigation from "./shared/components/Navigation";
import Footer from "./shared/components/Footer";

import CustomerListPage from "./pages/Customer/CustomerListPage";

function Home() {
  return (
    <div className="home-container">
      <h1>Profroid</h1>
      <p>Welcome to the Profroid frontend.</p>
    </div>
  );
}

function App(): React.ReactElement {
  return (
    <BrowserRouter>
      {/* 🌟 BEAUTIFUL NAVBAR */}
      <Navigation />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/customers" element={<CustomerListPage />} />
      </Routes>

      {/* 🌟 BEAUTIFUL FOOTER */}
      <Footer />
    </BrowserRouter>
  );
}

export default App;
