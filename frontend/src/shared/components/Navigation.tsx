import React, { useState } from "react";
import { Wine, Menu, X, LogIn, ShoppingCart } from "lucide-react";
import "./Navigation.css";

export default function Navigation(): React.ReactElement {
  const [open, setOpen] = useState(false);

  return (
    <nav className="nav-container">
      <div className="nav-inner">

        {/* Logo */}
        <div className="nav-logo">
          <Wine className="nav-logo-icon" />
          <span className="nav-logo-text">Profroid</span>
        </div>

        {/* Desktop Menu */}
        <div className="nav-links">
          <a href="/products">Products</a>
          <a href="/services">Services</a>
          <a href="/customers">Customers</a>
          <a href="/employees">Employees</a>
          <a href="/#about">About</a>
          <a href="/#contact">Contact</a>

          <button className="nav-cart">
            <ShoppingCart className="icon" />
          </button>

          <button className="nav-book">Book Appointment</button>

          <button className="nav-signin">
            <LogIn className="icon" /> Sign In
          </button>
        </div>

        {/* Mobile Toggle */}
        <button className="nav-mobile-toggle" onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="nav-mobile-menu">
          <a href="/products">Products</a>
          <a href="/services">Services</a>
          <a href="/customers">Customers</a>
          <a href="/employees">Employees</a>
          <a href="/#about">About</a>
          <a href="/#contact">Contact</a>

          <button className="nav-book w-full">Book Appointment</button>
          <button className="nav-signin w-full"><LogIn className="icon" /> Sign In</button>
        </div>
      )}
    </nav>
  );
}
