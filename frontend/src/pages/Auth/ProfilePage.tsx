import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../features/authentication/store/authStore';
import '../Auth.css';

export default function ProfilePage() {
  const navigate = useNavigate();
  const {
    user,
    updateProfile,
    changePassword,
    logout,
    isLoading,
    error,
    clearError,
  } = useAuthStore();

  const [editMode, setEditMode] = useState(false);
  const [passwordMode, setPasswordMode] = useState(false);
  const [formError, setFormError] = useState('');

  // Profile form state
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [postalCode, setPostalCode] = useState(user?.postalCode || '');
  const [city, setCity] = useState(user?.city || '');
  const [province, setProvince] = useState(user?.province || '');
  const [country, setCountry] = useState(user?.country || '');

  // Password form state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <p>Please log in to view your profile</p>
          <button
            onClick={() => navigate('/login')}
            className="btn-primary"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    clearError();

    const updates: Record<string, string> = {};
    if (name !== user.name) updates.name = name;
    if (phone !== (user.phone || '')) updates.phone = phone;
    if (address !== (user.address || '')) updates.address = address;
    if (postalCode !== (user.postalCode || '')) updates.postalCode = postalCode;
    if (city !== (user.city || '')) updates.city = city;
    if (province !== (user.province || '')) updates.province = province;
    if (country !== (user.country || '')) updates.country = country;

    if (Object.keys(updates).length === 0) {
      setFormError('No changes to save');
      return;
    }

    const success = await updateProfile(updates);
    if (success) {
      setEditMode(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    clearError();

    if (!oldPassword || !newPassword || !confirmPassword) {
      setFormError('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }

    const success = await changePassword(oldPassword, newPassword);
    if (success) {
      setPasswordMode(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <h1>My Profile</h1>
          <button
            onClick={handleLogout}
            className="btn-secondary"
            disabled={isLoading}
          >
            Logout
          </button>
        </div>

        {/* Profile Information */}
        {!passwordMode && (
          <div className="profile-section">
            <div className="section-header">
              <h2>Profile Information</h2>
              {!editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="btn-secondary"
                >
                  Edit
                </button>
              )}
            </div>

            {editMode ? (
              <form onSubmit={handleProfileSubmit} className="auth-form">
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email (Read Only)</label>
                  <input
                    id="email"
                    type="email"
                    value={user.email}
                    disabled
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone</label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    disabled={isLoading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="address">Address</label>
                  <input
                    id="address"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Main St"
                    disabled={isLoading}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="postalCode">Postal Code</label>
                    <input
                      id="postalCode"
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="A1A 1A1"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="city">City</label>
                    <input
                      id="city"
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Toronto"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="province">Province</label>
                    <input
                      id="province"
                      type="text"
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      placeholder="ON"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="country">Country</label>
                    <input
                      id="country"
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Canada"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {(formError || error) && (
                  <div className="alert alert-error">
                    {formError || error}
                  </div>
                )}

                <div className="form-actions">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary"
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditMode(false);
                      setName(user.name);
                      setPhone(user.phone || '');
                      setAddress(user.address || '');
                      setPostalCode(user.postalCode || '');
                      setCity(user.city || '');
                      setProvince(user.province || '');
                      setCountry(user.country || '');
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-info">
                <div className="info-row">
                  <span className="label">Name:</span>
                  <span className="value">{user.name}</span>
                </div>
                <div className="info-row">
                  <span className="label">Email:</span>
                  <span className="value">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="info-row">
                    <span className="label">Phone:</span>
                    <span className="value">{user.phone}</span>
                  </div>
                )}
                {user.address && (
                  <div className="info-row">
                    <span className="label">Address:</span>
                    <span className="value">{user.address}</span>
                  </div>
                )}
                {user.city && (
                  <div className="info-row">
                    <span className="label">City:</span>
                    <span className="value">
                      {user.city}
                      {user.province && `, ${user.province}`}
                    </span>
                  </div>
                )}
                {user.country && (
                  <div className="info-row">
                    <span className="label">Country:</span>
                    <span className="value">{user.country}</span>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setPasswordMode(true)}
              className="btn-secondary"
              style={{ marginTop: '1rem' }}
            >
              Change Password
            </button>
          </div>
        )}

        {/* Change Password */}
        {passwordMode && (
          <div className="profile-section">
            <div className="section-header">
              <h2>Change Password</h2>
            </div>

            <form onSubmit={handlePasswordSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="oldPassword">Current Password</label>
                <input
                  id="oldPassword"
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  required
                />
              </div>

              {(formError || error) && (
                <div className="alert alert-error">
                  {formError || error}
                </div>
              )}

              <div className="form-actions">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary"
                >
                  {isLoading ? 'Updating...' : 'Update Password'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPasswordMode(false);
                    setOldPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setFormError('');
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
