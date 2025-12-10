import { useState, useEffect, useCallback } from 'react';
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

  // Schedule state (for employees)
  const [schedule, setSchedule] = useState<Record<string, unknown>[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState('');

  // Employee identifiers for schedule and updates
  const [employeeId, setEmployeeId] = useState<string | null>(null);

  // Customer data state (address, phone, etc.)
  const [customerData, setCustomerData] = useState<Record<string, unknown> | null>(null);

  // Fetch customer data and employee schedule when component loads or user role changes
  const fetchEmployeeData = useCallback(async () => {
    if (!user?.id) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/employees/by-user/${user.id}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCustomerData(data); // Reuse customerData state for employee data
        if (data.employeeIdentifier?.employeeId) {
          setEmployeeId(data.employeeIdentifier.employeeId);
        }
        // Update form fields with employee data
        if (data.employeeAddress?.streetAddress) setAddress(data.employeeAddress.streetAddress);
        if (data.employeeAddress?.city) setCity(data.employeeAddress.city);
        if (data.employeeAddress?.province) setProvince(data.employeeAddress.province);
        if (data.employeeAddress?.country) setCountry(data.employeeAddress.country);
        if (data.employeeAddress?.postalCode) setPostalCode(data.employeeAddress.postalCode);
        // Extract phone number from phoneNumbers array
        if (data.phoneNumbers && data.phoneNumbers.length > 0) {
          setPhone(data.phoneNumbers[0].number || '');
        }
      } else if (response.status === 404) {
        // No employee record yet; clear employee-specific state
        setEmployeeId(null);
        setSchedule([]);
      }
    } catch (error) {
      console.error('Error fetching employee data:', error);
    }
  }, [user?.id]);

  const fetchCustomerData = useCallback(async () => {
    if (!user?.id) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/customers/by-user/${user.id}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCustomerData(data);
        // Update form fields with customer data
        if (data.streetAddress) setAddress(data.streetAddress);
        if (data.city) setCity(data.city);
        if (data.province) setProvince(data.province);
        if (data.country) setCountry(data.country);
        if (data.postalCode) setPostalCode(data.postalCode);
        // Extract phone number from phoneNumbers array
        if (data.phoneNumbers && data.phoneNumbers.length > 0) {
          setPhone(data.phoneNumbers[0].number || '');
        }
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
    }
  }, [user?.id]);

  const fetchEmployeeSchedule = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setScheduleLoading(true);
      setScheduleError('');
      const token = localStorage.getItem('authToken');
      
      // First, find the employee by userId
      const employeeResponse = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/employees/by-user/${user.id}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (employeeResponse.ok) {
        const employee = await employeeResponse.json();
        console.log('Employee data:', employee); // Debug log
        const empId = employee?.employeeIdentifier?.employeeId;
        if (empId) {
          setEmployeeId(empId);
          // Fetch schedule for this employee
          const scheduleResponse = await fetch(
            `${import.meta.env.VITE_BACKEND_URL}/employees/${empId}/schedules`,
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (scheduleResponse.ok) {
            const scheduleData = await scheduleResponse.json();
            console.log('Schedule data:', scheduleData); // Debug log
            setSchedule(scheduleData || []);
          } else {
            console.error('Schedule fetch failed with status:', scheduleResponse.status);
            setSchedule([]);
          }
        }
      } else if (employeeResponse.status === 404) {
        // Not an employee or not found
        console.log('Employee not found (404)');
        setEmployeeId(null);
        setSchedule([]);
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
      setScheduleError('Failed to load schedule');
    } finally {
      setScheduleLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      if (user?.employeeType) {
        fetchEmployeeData();
      } else {
        fetchCustomerData();
        setEmployeeId(null);
        setSchedule([]);
      }
    }
  }, [user?.id, user?.employeeType, fetchEmployeeData, fetchCustomerData]);

  // Once we know the employeeId, load the schedule
  useEffect(() => {
    if (user?.employeeType && employeeId) {
      fetchEmployeeSchedule();
    }
  }, [user?.employeeType, employeeId, fetchEmployeeSchedule]);

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

    try {
      const token = localStorage.getItem('authToken');

      if (user?.employeeType) {
        // Save employee data
        const resolvedEmployeeId = employeeId || (customerData as { employeeIdentifier?: { employeeId?: string } } | null)?.employeeIdentifier?.employeeId;

        const employeeUpdateData = {
          firstName: user.name?.split(' ')[0] || '',
          lastName: user.name?.split(' ').slice(1).join(' ') || '',
          employeeAddress: {
            streetAddress: address,
            city: city,
            province: province,
            country: country,
            postalCode: postalCode,
          },
          phoneNumbers: phone ? [{ number: phone, type: 'WORK' }] : (customerData?.phoneNumbers || []),
        };

        if (!resolvedEmployeeId) {
          throw new Error('No employee record found for this user. Assign the user as an employee first.');
        }

        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/employees/${resolvedEmployeeId}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(employeeUpdateData),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to save employee data');
        }

        const updatedData = await response.json();
        setCustomerData(updatedData);
      } else {
        // Save customer data
        const customerUpdateData = {
          userId: user.id,
          firstName: user.name?.split(' ')[0] || '',
          lastName: user.name?.split(' ').slice(1).join(' ') || '',
          streetAddress: address,
          city: city,
          province: province,
          country: country,
          postalCode: postalCode,
          // Backend PhoneType enum allows WORK, MOBILE, HOME; use MOBILE for customers.
          phoneNumbers: phone ? [{ number: phone, type: 'MOBILE' }] : (customerData?.phoneNumbers || []),
        };

        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/customers/by-user/${user.id}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(customerUpdateData),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to save customer data');
        }

        const updatedData = await response.json();
        setCustomerData(updatedData);
      }

      const updates: Record<string, string> = {};
      if (name !== user.name) updates.name = name;

      if (Object.keys(updates).length > 0) {
        const success = await updateProfile(updates);
        if (success) {
          setEditMode(false);
        }
      } else {
        setEditMode(false);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setFormError('Failed to save profile changes');
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
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => {
                if (user?.employeeType) {
                  fetchEmployeeData();
                  fetchEmployeeSchedule();
                } else {
                  fetchCustomerData();
                }
              }}
              className="btn-secondary"
              disabled={isLoading}
            >
              Refresh
            </button>
            <button
              onClick={handleLogout}
              className="btn-secondary"
              disabled={isLoading}
            >
              Logout
            </button>
          </div>
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
                      setPhone('');
                      setAddress((customerData?.streetAddress as string) || '');
                      setPostalCode((customerData?.postalCode as string) || '');
                      setCity((customerData?.city as string) || '');
                      setProvince((customerData?.province as string) || '');
                      setCountry((customerData?.country as string) || '');
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
                {user?.employeeType && (
                  <div className="info-row">
                    <span className="label">Employee Type:</span>
                    <span className="value">{user.employeeType}</span>
                  </div>
                )}
                {customerData && (customerData.phoneNumbers as Array<Record<string, unknown>> | undefined) && (customerData.phoneNumbers as Array<Record<string, unknown>>).length > 0 && (
                  <div className="info-row">
                    <span className="label">Phone:</span>
                    <span className="value">
                      {(customerData.phoneNumbers as Array<Record<string, unknown>>).map((p) => `${String(p.number)} (${String(p.type)})`).join(', ')}
                    </span>
                  </div>
                )}
                {customerData && (customerData.streetAddress as string || (customerData.employeeAddress as Record<string, unknown>)?.streetAddress as string) && (
                  <div className="info-row">
                    <span className="label">Address:</span>
                    <span className="value">{(customerData?.streetAddress as string) || ((customerData?.employeeAddress as Record<string, unknown>)?.streetAddress as string)}</span>
                  </div>
                )}
                {customerData && ((customerData.city as string) || ((customerData.employeeAddress as Record<string, unknown>)?.city as string)) && (
                  <div className="info-row">
                    <span className="label">City:</span>
                    <span className="value">
                      {(customerData?.city as string) || ((customerData?.employeeAddress as Record<string, unknown>)?.city as string)}
                      {((customerData?.province as string) || ((customerData?.employeeAddress as Record<string, unknown>)?.province as string)) && `, ${(customerData?.province as string) || ((customerData?.employeeAddress as Record<string, unknown>)?.province as string)}`}
                    </span>
                  </div>
                )}
                {customerData && ((customerData.postalCode as string) || ((customerData.employeeAddress as Record<string, unknown>)?.postalCode as string)) && (
                  <div className="info-row">
                    <span className="label">Postal Code:</span>
                    <span className="value">{(customerData?.postalCode as string) || ((customerData?.employeeAddress as Record<string, unknown>)?.postalCode as string)}</span>
                  </div>
                )}
                {customerData && ((customerData.country as string) || ((customerData.employeeAddress as Record<string, unknown>)?.country as string)) && (
                  <div className="info-row">
                    <span className="label">Country:</span>
                    <span className="value">{(customerData?.country as string) || ((customerData?.employeeAddress as Record<string, unknown>)?.country as string)}</span>
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

        {/* Employee Schedule */}
        {user?.employeeType && !passwordMode && (
          <div className="profile-section">
            <div className="section-header">
              <h2>My Schedule</h2>
            </div>

            {scheduleError && (
              <div className="alert alert-error">{scheduleError}</div>
            )}

            {scheduleLoading ? (
              <p>Loading schedule...</p>
            ) : schedule.length > 0 ? (
              <div className="schedule-table">
                <table>
                  <thead>
                    <tr>
                      <th>Day</th>
                      <th>Time Slots</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.map((day, index: number) => (
                      <tr key={index}>
                        <td>{String(day.dayOfWeek)}</td>
                        <td>{Array.isArray(day.timeSlots) ? (day.timeSlots as Array<unknown>).map(String).join(', ') : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No schedule set yet</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
