import React, { useState } from "react";
import { Wine, Menu, X, LogIn, ShoppingCart, LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../features/authentication/store/authStore";
import "./Navigation.css";

export default function Navigation(): React.ReactElement {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleLogin = () => {
    navigate("/login");
  };

  const handleProfile = () => {
    navigate("/profile");
  };

  // Check if user is admin
  const isAdmin = user?.role === "admin";

  // Check if user is technician employee
  const isTechnician =
    user?.role === "employee" && user?.employeeType === "TECHNICIAN";

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
          {/* Admin Links - only visible to admins */}
          {isAdmin && (
            <>
              <a href="/parts">Parts</a>
              <a href="/customers">Customers</a>
              <a href="/employees">Employees</a>
              <a href="/services">Services</a>
            </>
          )}

          {/* Employee Links - only visible to TECHNICIAN employees */}
          {isTechnician && (
            <>
              <a href="/my-jobs">My Jobs</a>
              <a href="/services">Services</a>
            </>
          )}

          {/* Customer Links - visible to customers */}
          {user?.role === "customer" && (
            <>
              <a href="/services">Services</a>
              <a href="/my-appointments">My Appointments</a>
            </>
          )}

          {/* Public Links */}
          {!isAuthenticated && (
            <>
              <a href="/#about">About</a>
              <a href="/#contact">Contact</a>
            </>
          )}

          {isAuthenticated && (
            <button className="nav-cart">
              <ShoppingCart className="icon" />
            </button>
          )}

          {isAuthenticated && (
            <button className="nav-book">Book Appointment</button>
          )}

          {isAuthenticated ? (
            <>
              <button className="nav-profile" onClick={handleProfile}>
                <User className="icon" /> {user?.email || "Profile"}
              </button>
              <button className="nav-logout" onClick={handleLogout}>
                <LogOut className="icon" /> Logout
              </button>
            </>
          ) : (
            <button className="nav-signin" onClick={handleLogin}>
              <LogIn className="icon" /> Sign In
            </button>
          )}
        </div>

        {/* Mobile Toggle */}
        <button className="nav-mobile-toggle" onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="nav-mobile-menu">
          {/* Admin Links - only visible to admins */}
          {isAdmin && (
            <>
              <a href="/parts">Parts</a>
              <a href="/customers">Customers</a>
              <a href="/employees">Employees</a>
              <a href="/services">Services</a>
            </>
          )}

          {/* Employee Links - only visible to TECHNICIAN employees */}
          {isTechnician && (
            <>
              <a href="/my-jobs">My Jobs</a>
              <a href="/services">Services</a>
            </>
          )}

          {/* Customer Links - visible to customers */}
          {user?.role === "customer" && (
            <>
              <a href="/services">Services</a>
              <a href="/my-appointments">My Appointments</a>
            </>
          )}

          {/* Public Links */}
          {!isAuthenticated && (
            <>
              <a href="/#about">About</a>
              <a href="/#contact">Contact</a>
            </>
          )}

          {isAuthenticated && (
            <button className="nav-book w-full">Book Appointment</button>
          )}

          {isAuthenticated ? (
            <>
              <button className="nav-mobile-profile" onClick={handleProfile}>
                <User className="icon" /> {user?.email || "Profile"}
              </button>
              <button className="nav-mobile-logout" onClick={handleLogout}>
                <LogOut className="icon" /> Logout
              </button>
            </>
          ) : (
            <button className="nav-mobile-signin" onClick={handleLogin}>
              <LogIn className="icon" /> Sign In
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
