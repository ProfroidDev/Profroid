import React, { useState, useEffect } from 'react';
import { Menu, X, LogIn, LogOut, User, Globe, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../features/authentication/store/authStore';
import './Navigation.css';

export default function Navigation(): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { t, i18n } = useTranslation();

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080/api/v1';

  // Fetch unread message count for admin
  useEffect(() => {
    if (!isAuthenticated || user?.role?.toLowerCase() !== 'admin') {
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        const response = await fetch(`${backendUrl}/contact/unread-count`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data: { unreadCount: number } = await response.json();
          setUnreadCount(data.unreadCount);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    // Fetch immediately
    fetchUnreadCount();

    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user?.role, backendUrl]);

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  const handleLogin = () => {
    navigate('/auth/login');
  };

  const handleProfile = () => {
    navigate('/profile');
  };

  const closeMobileMenu = () => {
    setOpen(false);
    setLanguageOpen(false);
  };

  const handleMobileProfile = () => {
    closeMobileMenu();
    handleProfile();
  };

  const handleMobileLogin = () => {
    closeMobileMenu();
    handleLogin();
  };

  const handleMobileLogout = async () => {
    closeMobileMenu();
    await handleLogout();
  };

  const handleMobileLanguageChange = (lang: string) => {
    changeLanguage(lang);
    setOpen(false);
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    setLanguageOpen(false);
  };

  // Check if user is admin (case-insensitive)
  const isAdmin = user?.role?.toLowerCase() === 'admin';

  // Check if user is technician employee (case-insensitive)
  const isTechnician =
    user?.role?.toLowerCase() === 'employee' && user?.employeeType === 'TECHNICIAN';

  // Get display role text
  const getRoleDisplay = () => {
    if (user?.role?.toLowerCase() === 'admin') {
      return t('common.roleAdmin');
    } else if (user?.role?.toLowerCase() === 'employee') {
      return t('common.roleEmployee');
    } else if (user?.role?.toLowerCase() === 'customer') {
      return t('common.roleClient');
    }
    return '';
  };

  return (
    <nav className="nav-container">
      <div className="nav-inner">
        {/* Logo */}
        <a href="/" className="nav-logo">
          <img src="/profroid-logo.svg" alt="Profroid logo" style={{ height: 36, width: 'auto' }} />
          <span className="nav-logo-text">{t('common.appName')}</span>
        </a>
        {/* Desktop Menu */}
        <div className="nav-links">
          {/* Admin Links - only visible to admins */}
          {isAdmin && (
            <>
              <a href="/parts">{t('navigation.parts')}</a>
              <a href="/inventory">{t('navigation.inventory')}</a>
              <a href="/service-reports">{t('navigation.serviceReports')}</a>
              <a href="/reviews">{t('navigation.reviews')}</a>
              <a href="/admin/appointments">{t('navigation.appointments')}</a>
              <a href="/customers">{t('navigation.customers')}</a>
              <a href="/employees">{t('navigation.employees')}</a>
              <a href="/services">{t('navigation.services')}</a>
              <a href="/admin/messages" className="nav-messages-link">
                <Mail size={16} style={{ display: 'inline', marginRight: 4 }} />
                Messages
                {unreadCount > 0 && (
                  <span className="nav-unread-badge">{unreadCount}</span>
                )}
              </a>
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
          {user?.role === 'customer' && (
            <>
              <a href="/services">{t('navigation.services')}</a>
              <a href="/my-appointments">{t('navigation.myAppointments')}</a>
              <a href="/my-bills">{t('navigation.myBills')}</a>
            </>
          )}

          {/* Public Links */}
          {!isAuthenticated && (
            <>
              <a href="/services">{t('navigation.services')}</a>
              <a href="/about">{t('navigation.about')}</a>
              <a href="/contact">{t('navigation.contact')}</a>
            </>
          )}

          {isAuthenticated ? (
            <>
              <button className="nav-profile" onClick={handleProfile}>
                <User className="icon" />
                <span className="nav-profile-content">
                  <span className="nav-profile-email">{user?.email || t('common.profile')}</span>
                  <span className="nav-profile-role">{getRoleDisplay()}</span>
                </span>
              </button>
              <button className="nav-logout" onClick={handleLogout}>
                <LogOut className="icon" /> {t('common.logout')}
              </button>

              {/* Language Switcher */}
              <div className="nav-language-container">
                <button
                  className="nav-language-button"
                  onClick={() => setLanguageOpen(!languageOpen)}
                  aria-label={t('common.language')}
                >
                  <Globe className="language-icon" />
                  <span className="language-text">{i18n.language.toUpperCase()}</span>
                </button>
                {languageOpen && (
                  <div className="nav-language-dropdown">
                    <button
                      className={`language-option ${i18n.language === 'en' ? 'active' : ''}`}
                      onClick={() => changeLanguage('en')}
                    >
                      <span className="language-name">English</span>
                    </button>
                    <button
                      className={`language-option ${i18n.language === 'fr' ? 'active' : ''}`}
                      onClick={() => changeLanguage('fr')}
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
                <LogIn className="icon" /> {t('navigation.signIn')}
              </button>

              {/* Language Switcher */}
              <div className="nav-language-container">
                <button
                  className="nav-language-button"
                  onClick={() => setLanguageOpen(!languageOpen)}
                  aria-label={t('common.language')}
                >
                  <Globe className="language-icon" />
                  <span className="language-text">{i18n.language.toUpperCase()}</span>
                </button>
                {languageOpen && (
                  <div className="nav-language-dropdown">
                    <button
                      className={`language-option ${i18n.language === 'en' ? 'active' : ''}`}
                      onClick={() => changeLanguage('en')}
                    >
                      <span className="language-name">English</span>
                    </button>
                    <button
                      className={`language-option ${i18n.language === 'fr' ? 'active' : ''}`}
                      onClick={() => changeLanguage('fr')}
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
              <a href="/parts" onClick={closeMobileMenu}>
                {t('navigation.parts')}
              </a>
              <a href="/inventory" onClick={closeMobileMenu}>
                {t('navigation.inventory')}
              </a>
              <a href="/service-reports" onClick={closeMobileMenu}>
                {t('navigation.serviceReports')}
              </a>
              <a href="/reviews" onClick={closeMobileMenu}>
                {t('navigation.reviews')}
              </a>
              <a href="/admin/appointments" onClick={closeMobileMenu}>
                {t('navigation.appointments')}
              </a>
              <a href="/customers" onClick={closeMobileMenu}>
                {t('navigation.customers')}
              </a>
              <a href="/employees" onClick={closeMobileMenu}>
                {t('navigation.employees')}
              </a>
              <a href="/services" onClick={closeMobileMenu}>
                {t('navigation.services')}
              </a>
              <a href="/admin/messages" onClick={closeMobileMenu} className="nav-messages-link-mobile">
                <Mail size={16} style={{ display: 'inline', marginRight: 4 }} />
                Messages
                {unreadCount > 0 && (
                  <span className="nav-unread-badge-mobile">{unreadCount}</span>
                )}
              </a>
            </>
          )}

          {/* Employee Links - only visible to TECHNICIAN employees */}
          {isTechnician && (
            <>
              <a href="/my-jobs" onClick={closeMobileMenu}>
                {t('navigation.myJobs')}
              </a>
              <a href="/services" onClick={closeMobileMenu}>
                {t('navigation.services')}
              </a>
            </>
          )}

          {/* Customer Links - visible to customers */}
          {user?.role === 'customer' && (
            <>
              <a href="/services" onClick={closeMobileMenu}>
                {t('navigation.services')}
              </a>
              <a href="/my-appointments" onClick={closeMobileMenu}>
                {t('navigation.myAppointments')}
              </a>
              <a href="/my-bills" onClick={closeMobileMenu}>
                {t('navigation.myBills')}
              </a>
            </>
          )}

          {/* Public Links */}
          {!isAuthenticated && (
            <>
              <a href="/services" onClick={closeMobileMenu}>
                {t('navigation.services')}
              </a>
              <a href="/#about" onClick={closeMobileMenu}>
                {t('navigation.about')}
              </a>
              <a href="/#contact" onClick={closeMobileMenu}>
                {t('navigation.contact')}
              </a>
            </>
          )}

          {/* Language Switcher Mobile */}
          <div className="nav-language-mobile">
            <div className="language-mobile-label">
              <Globe className="icon" />
              <span>{t('common.language')}</span>
            </div>
            <div className="language-mobile-options">
              <button
                className={`language-mobile-option ${i18n.language === 'en' ? 'active' : ''}`}
                onClick={() => handleMobileLanguageChange('en')}
              >
                <span className="language-flag">🇬🇧</span>
                <span>English</span>
              </button>
              <button
                className={`language-mobile-option ${i18n.language === 'fr' ? 'active' : ''}`}
                onClick={() => handleMobileLanguageChange('fr')}
              >
                <span className="language-flag">🇫🇷</span>
                <span>Français</span>
              </button>
            </div>
          </div>

          {isAuthenticated && (
            <button className="nav-book w-full" onClick={closeMobileMenu}>
              {t('navigation.bookAppointment')}
            </button>
          )}

          {isAuthenticated ? (
            <>
              <button className="nav-mobile-profile" onClick={handleMobileProfile}>
                <User className="icon" />
                <span className="nav-profile-content">
                  <span className="nav-profile-email">{user?.email || t('common.profile')}</span>
                  <span className="nav-profile-role">{getRoleDisplay()}</span>
                </span>
              </button>
              <button className="nav-mobile-logout" onClick={handleMobileLogout}>
                <LogOut className="icon" /> {t('common.logout')}
              </button>
            </>
          ) : (
            <button className="nav-mobile-signin" onClick={handleMobileLogin}>
              <LogIn className="icon" /> {t('navigation.signIn')}
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
