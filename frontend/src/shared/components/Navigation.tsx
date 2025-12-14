import React, { useState } from "react";
import { Wine, Menu, X, LogIn, ShoppingCart, LogOut, User, Globe } from "lucide-react";
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
    navigate("/login");
  };

  const handleLogin = () => {
    navigate("/login");
  };

  const handleProfile = () => {
    navigate("/profile");
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    setLanguageOpen(false);
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
          <span className="nav-logo-text">{t('common.appName')}</span>
        </div>

        {/* Desktop Menu */}
        <div className="nav-links">
          {/* Admin Links - only visible to admins */}
          {isAdmin && (
            <>
              <a href="/parts">{t('navigation.parts')}</a>
              <a href="/customers">{t('navigation.customers')}</a>
              <a href="/employees">{t('navigation.employees')}</a>
              <a href="/services">{t('navigation.services')}</a>
            </>
          )}

          {/* Employee Links - only visible to TECHNICIAN employees */}
          {isTechnician && (
            <>
              <a href="/my-jobs">{t('navigation.myJobs')}</a>
              <a href="/services">{t('navigation.services')}</a>
            </>
          )}

          {/* Customer Links - visible to customers */}
          {user?.role === "customer" && (
            <>
              <a href="/services">{t('navigation.services')}</a>
              <a href="/my-appointments">{t('navigation.myAppointments')}</a>
            </>
          )}

          {/* Public Links */}
          {!isAuthenticated && (
            <>
              <a href="/#about">{t('navigation.about')}</a>
              <a href="/#contact">{t('navigation.contact')}</a>
            </>
          )}

          {/* Language Switcher */}
          <div className="nav-language-switcher" style={{ position: 'relative' }}>
            <button 
              className="nav-language-toggle"
              onClick={() => setLanguageOpen(!languageOpen)}
              title={t('common.language')}
            >
              <Globe className="icon" />
              <span>{i18n.language.toUpperCase()}</span>
            </button>
            {languageOpen && (
              <div className="nav-language-menu" style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                backgroundColor: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                zIndex: 1000,
                minWidth: '120px'
              }}>
                <button 
                  onClick={() => changeLanguage('en')}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '10px 15px',
                    border: 'none',
                    background: i18n.language === 'en' ? '#f0f0f0' : 'white',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '14px'
                  }}
                >
                  English
                </button>
                <button 
                  onClick={() => changeLanguage('fr')}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '10px 15px',
                    border: 'none',
                    background: i18n.language === 'fr' ? '#f0f0f0' : 'white',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '14px',
                    borderTop: '1px solid #e0e0e0'
                  }}
                >
                  Français
                </button>
              </div>
            )}
          </div>

          {isAuthenticated && (
            <button className="nav-cart">
              <ShoppingCart className="icon" />
            </button>
          )}

          {isAuthenticated && (
            <button className="nav-book">{t('navigation.bookAppointment')}</button>
          )}

          {isAuthenticated ? (
            <>
              <button className="nav-profile" onClick={handleProfile}>
                <User className="icon" /> {user?.email || t('common.profile')}
              </button>
              <button className="nav-logout" onClick={handleLogout}>
                <LogOut className="icon" /> {t('common.logout')}
              </button>
            </>
          ) : (
            <button className="nav-signin" onClick={handleLogin}>
              <LogIn className="icon" /> {t('navigation.signIn')}
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
              <a href="/parts">{t('navigation.parts')}</a>
              <a href="/customers">{t('navigation.customers')}</a>
              <a href="/employees">{t('navigation.employees')}</a>
              <a href="/services">{t('navigation.services')}</a>
            </>
          )}

          {/* Employee Links - only visible to TECHNICIAN employees */}
          {isTechnician && (
            <>
              <a href="/my-jobs">{t('navigation.myJobs')}</a>
              <a href="/services">{t('navigation.services')}</a>
            </>
          )}

          {/* Customer Links - visible to customers */}
          {user?.role === "customer" && (
            <>
              <a href="/services">{t('navigation.services')}</a>
              <a href="/my-appointments">{t('navigation.myAppointments')}</a>
            </>
          )}

          {/* Public Links */}
          {!isAuthenticated && (
            <>
              <a href="/#about">{t('navigation.about')}</a>
              <a href="/#contact">{t('navigation.contact')}</a>
            </>
          )}

          {/* Language Switcher Mobile */}
          <div style={{ padding: '10px 0', borderTop: '1px solid #e0e0e0' }}>
            <button 
              onClick={() => changeLanguage('en')}
              style={{
                display: 'block',
                width: '100%',
                padding: '10px 15px',
                border: 'none',
                background: i18n.language === 'en' ? '#f0f0f0' : 'white',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '14px'
              }}
            >
              English
            </button>
            <button 
              onClick={() => changeLanguage('fr')}
              style={{
                display: 'block',
                width: '100%',
                padding: '10px 15px',
                border: 'none',
                background: i18n.language === 'fr' ? '#f0f0f0' : 'white',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '14px'
              }}
            >
              Français
            </button>
          </div>

          {isAuthenticated && (
            <button className="nav-book w-full">{t('navigation.bookAppointment')}</button>
          )}

          {isAuthenticated ? (
            <>
              <button className="nav-mobile-profile" onClick={handleProfile}>
                <User className="icon" /> {user?.email || t('common.profile')}
              </button>
              <button className="nav-mobile-logout" onClick={handleLogout}>
                <LogOut className="icon" /> {t('common.logout')}
              </button>
            </>
          ) : (
            <button className="nav-mobile-signin" onClick={handleLogin}>
              <LogIn className="icon" /> {t('navigation.signIn')}
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
