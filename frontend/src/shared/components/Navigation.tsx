import React, { useState } from "react";
import {
  Wine,
  Menu,
  X,
  LogIn,
  ShoppingCart,
  LogOut,
  User,
  Globe,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useAuthStore from "../../features/authentication/store/authStore";
import "./Navigation.css";

export default function Navigation(): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { t, i18n } = useTranslation();

  const handleLogout = async () => {
    await logout();
    navigate("/auth/login");
  };

  const handleLogin = () => {
    navigate("/auth/login");
  };

  const handleProfile = () => {
    navigate("/profile");
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    setLanguageOpen(false);
  };

  // Check if user is admin (case-insensitive)
  const isAdmin = user?.role?.toLowerCase() === "admin";

  // Check if user is technician employee (case-insensitive)
  const isTechnician =
    user?.role?.toLowerCase() === "employee" && user?.employeeType === "TECHNICIAN";

  return (
    <nav className="nav-container">
      <div className="nav-inner">
        {/* Logo */}
        <a href="/" className="nav-logo">
          <Wine className="nav-logo-icon" />
          <span className="nav-logo-text">{t("common.appName")}</span>
        </a>

        {/* Desktop Menu */}
        <div className="nav-links">
          {/* Admin Links - only visible to admins */}
          {isAdmin && (
            <>
              <a href="/parts">{t("navigation.parts")}</a>
              <a href="/inventory">{t("navigation.inventory")}</a>
              <a href="/service-reports">{t("navigation.serviceReports")}</a>
              <a href="/customers">{t("navigation.customers")}</a>
              <a href="/employees">{t("navigation.employees")}</a>
              <a href="/services">{t("navigation.services")}</a>
            </>
          )}

          {/* Employee Links - only visible to TECHNICIAN employees */}
          {isTechnician && (
            <>
              <a href="/my-jobs">{t("navigation.myJobs")}</a>
              <a href="/services">{t("navigation.services")}</a>
            </>
          )}

          {/* Customer Links - visible to customers */}
          {user?.role === "customer" && (
            <>
              <a href="/services">{t("navigation.services")}</a>
              <a href="/my-appointments">{t("navigation.myAppointments")}</a>
              <a href="/my-bills">{t("navigation.myBills")}</a>
            </>
          )}

          {/* Public Links */}
          {!isAuthenticated && (
            <>
              <a href="/#about">{t("navigation.about")}</a>
              <a href="/#contact">{t("navigation.contact")}</a>
            </>
          )}

          {isAuthenticated && (
            <button className="nav-cart">
              <ShoppingCart className="icon" />
            </button>
          )}

          {isAuthenticated && (
            <button className="nav-book">
              {t("navigation.bookAppointment")}
            </button>
          )}

          {isAuthenticated ? (
            <>
              <button className="nav-profile" onClick={handleProfile}>
                <User className="icon" /> {user?.email || t("common.profile")}
              </button>
              <button className="nav-logout" onClick={handleLogout}>
                <LogOut className="icon" /> {t("common.logout")}
              </button>
              
              {/* Language Switcher */}
              <div className="nav-language-container">
                <button
                  className="nav-language-button"
                  onClick={() => setLanguageOpen(!languageOpen)}
                  aria-label={t("common.language")}
                >
                  <Globe className="language-icon" />
                  <span className="language-text">
                    {i18n.language.toUpperCase()}
                  </span>
                </button>
                {languageOpen && (
                  <div className="nav-language-dropdown">
                    <button
                      className={`language-option ${
                        i18n.language === "en" ? "active" : ""
                      }`}
                      onClick={() => changeLanguage("en")}
                    >
                      <span className="language-name">English</span>
                    </button>
                    <button
                      className={`language-option ${
                        i18n.language === "fr" ? "active" : ""
                      }`}
                      onClick={() => changeLanguage("fr")}
                    >
                      <span className="language-name">Français</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button className="nav-signin" onClick={handleLogin}>
                <LogIn className="icon" /> {t("navigation.signIn")}
              </button>
              
              {/* Language Switcher */}
              <div className="nav-language-container">
                <button
                  className="nav-language-button"
                  onClick={() => setLanguageOpen(!languageOpen)}
                  aria-label={t("common.language")}
                >
                  <Globe className="language-icon" />
                  <span className="language-text">
                    {i18n.language.toUpperCase()}
                  </span>
                </button>
                {languageOpen && (
                  <div className="nav-language-dropdown">
                    <button
                      className={`language-option ${
                        i18n.language === "en" ? "active" : ""
                      }`}
                      onClick={() => changeLanguage("en")}
                    >
                      <span className="language-name">English</span>
                    </button>
                    <button
                      className={`language-option ${
                        i18n.language === "fr" ? "active" : ""
                      }`}
                      onClick={() => changeLanguage("fr")}
                    >
                      <span className="language-name">Français</span>
                    </button>
                  </div>
                )}
              </div>
            </>
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
              <a href="/parts">{t("navigation.parts")}</a>
              <a href="/inventory">{t("navigation.inventory")}</a>
              <a href="/service-reports">{t("navigation.serviceReports")}</a>
              <a href="/customers">{t("navigation.customers")}</a>
              <a href="/employees">{t("navigation.employees")}</a>
              <a href="/services">{t("navigation.services")}</a>
            </>
          )}

          {/* Employee Links - only visible to TECHNICIAN employees */}
          {isTechnician && (
            <>
              <a href="/my-jobs">{t("navigation.myJobs")}</a>
              <a href="/services">{t("navigation.services")}</a>
            </>
          )}

          {/* Customer Links - visible to customers */}
          {user?.role === "customer" && (
            <>
              <a href="/services">{t("navigation.services")}</a>
              <a href="/my-appointments">{t("navigation.myAppointments")}</a>
              <a href="/my-bills">{t("navigation.myBills")}</a>
            </>
          )}

          {/* Public Links */}
          {!isAuthenticated && (
            <>
              <a href="/#about">{t("navigation.about")}</a>
              <a href="/#contact">{t("navigation.contact")}</a>
            </>
          )}

          {/* Language Switcher Mobile */}
          <div className="nav-language-mobile">
            <div className="language-mobile-label">
              <Globe className="icon" />
              <span>{t("common.language")}</span>
            </div>
            <div className="language-mobile-options">
              <button
                className={`language-mobile-option ${
                  i18n.language === "en" ? "active" : ""
                }`}
                onClick={() => changeLanguage("en")}
              >
                <span className="language-flag">🇬🇧</span>
                <span>English</span>
              </button>
              <button
                className={`language-mobile-option ${
                  i18n.language === "fr" ? "active" : ""
                }`}
                onClick={() => changeLanguage("fr")}
              >
                <span className="language-flag">🇫🇷</span>
                <span>Français</span>
              </button>
            </div>
          </div>

          {isAuthenticated && (
            <button className="nav-book w-full">
              {t("navigation.bookAppointment")}
            </button>
          )}

          {isAuthenticated ? (
            <>
              <button className="nav-mobile-profile" onClick={handleProfile}>
                <User className="icon" /> {user?.email || t("common.profile")}
              </button>
              <button className="nav-mobile-logout" onClick={handleLogout}>
                <LogOut className="icon" /> {t("common.logout")}
              </button>
            </>
          ) : (
            <button className="nav-mobile-signin" onClick={handleLogin}>
              <LogIn className="icon" /> {t("navigation.signIn")}
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
