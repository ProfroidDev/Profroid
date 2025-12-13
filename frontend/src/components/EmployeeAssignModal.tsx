import { useState, useEffect } from 'react';
import { getErrorMessage } from '../shared/api/errorHandler';
import { addEmployee } from '../features/employee/api/addEmployee';
import type { EmployeeRequestModel } from '../features/employee/models/EmployeeRequestModel';
import type { EmployeePhoneNumber } from '../features/employee/models/EmployeePhoneNumber';
import type { EmployeeRole, EmployeeRoleType } from '../features/employee/models/EmployeeRole';
import type { EmployeeAddress } from '../features/employee/models/EmployeeAddress';
import type { EmployeePhoneType } from '../features/employee/models/EmployeePhoneType';
import './EmployeeAddModal.css';

interface UnassignedUser {
  id: string;
  email: string;
  name: string;
}

interface CustomerPhoneNumber {
  number: string;
  phoneNumber?: string;
  type: string;
  phoneType?: string;
}

interface CustomerData {
  firstName?: string;
  lastName?: string;
  streetAddress?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
  phoneNumbers?: CustomerPhoneNumber[];
}

interface EmployeeAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const EMPLOYEE_TYPES: EmployeeRoleType[] = ['TECHNICIAN', 'ADMIN', 'SUPPORT', 'SALES'];
const provinces = ['Ontario', 'Quebec', 'British Columbia', 'Alberta', 'Manitoba', 'Saskatchewan', 'Nova Scotia'];
const phoneTypes = ['MOBILE', 'HOME', 'WORK'];

export default function EmployeeAssignModal({ isOpen, onClose, onSuccess }: EmployeeAssignModalProps) {
  const [step, setStep] = useState<'selectUser' | 'enterDetails'>('selectUser');
  const [selectedUser, setSelectedUser] = useState<UnassignedUser | null>(null);
  
  const [formData, setFormData] = useState({
    userId: '',
    employeeType: EMPLOYEE_TYPES[0] || 'TECHNICIAN',
    firstName: '',
    lastName: '',
    streetAddress: '',
    city: '',
    province: provinces[0] || '',
    country: 'Canada',
    postalCode: '',
    phoneNumbers: [{ number: '', type: 'MOBILE' }],
  });

  const [unassignedUsers, setUnassignedUsers] = useState<UnassignedUser[]>([]);
  const [allUsers, setAllUsers] = useState<UnassignedUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [fetchError, setFetchError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch unassigned users when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('selectUser');
      setSelectedUser(null);
      setSearchQuery('');
      setUnassignedUsers([]);
      setAllUsers([]);
      setFormData({
        userId: '',
        employeeType: EMPLOYEE_TYPES[0] || 'TECHNICIAN',
        firstName: '',
        lastName: '',
        streetAddress: '',
        city: '',
        province: provinces[0] || '',
        country: 'Canada',
        postalCode: '',
        phoneNumbers: [{ number: '', type: 'MOBILE' }],
      });
    }
  }, [isOpen]);

  // Debounce search
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setUnassignedUsers([]);
      setAllUsers([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      fetchUnassignedUsers(searchQuery);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const fetchUnassignedUsers = async (query: string = '') => {
    try {
      setFetchError('');
      const token = localStorage.getItem('authToken');
      
      // Only search if query is at least 2 characters
      if (query.trim().length < 2) {
        setUnassignedUsers([]);
        setAllUsers([]);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/search-users?q=${encodeURIComponent(query)}&limit=50`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`);
      }

      const result = await response.json();
      const users = (result.data || []).map((u: { userId: string; email: string }) => ({
        id: u.userId,
        email: u.email,
        name: u.email, // Use email as name since we don't have separate name field
      }));
      setUnassignedUsers(users);
      setAllUsers(users);
    } catch (error: unknown) {
      console.error('Error fetching users:', error);
      setFetchError(getErrorMessage(error));
    }
  };

  // Filter users based on search query
  const filteredUsers = searchQuery.trim()
    ? allUsers.filter(user =>
        (user.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allUsers;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };



  const removePhoneField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      phoneNumbers: prev.phoneNumbers.filter((_, i) => i !== index),
    }));
  };

  const handleUserSelect = (userId: string) => {
    const user = unassignedUsers.find(u => u.id === userId);
    if (user) {
      setSelectedUser(user);
      // Pre-fill name from user account
      const nameParts = user.name?.split(' ') || ['', ''];
      setFormData(prev => ({
        ...prev,
        userId: user.id,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || nameParts[0] || '',
      }));
      
      // Fetch customer data to pre-fill address and phone
      fetchCustomerData(user.id);
      setStep('enterDetails');
    }
  };

  const fetchCustomerData = async (userId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const url = `${import.meta.env.VITE_BACKEND_URL}/customers/by-user/${userId}`;
      console.log('Fetching customer data from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn(`Failed to fetch customer data: ${response.status} ${response.statusText}`);
        return;
      }

      const customerData: CustomerData = await response.json();
      console.log('Customer data received:', customerData);
      
      // Safely map phone numbers with fallback
      let mappedPhones = [{ number: '', type: 'MOBILE' }];
      if (customerData.phoneNumbers && Array.isArray(customerData.phoneNumbers) && customerData.phoneNumbers.length > 0) {
        mappedPhones = customerData.phoneNumbers.map((p: CustomerPhoneNumber) => ({
          number: String(p.number || p.phoneNumber || ''),
          type: String(p.type || p.phoneType || 'MOBILE'),
        }));
      }
      
      // Pre-fill form with customer data
      setFormData(prev => ({
        ...prev,
        firstName: customerData.firstName || prev.firstName,
        lastName: customerData.lastName || prev.lastName,
        streetAddress: customerData.streetAddress || '',
        city: customerData.city || '',
        province: customerData.province || prev.province,
        postalCode: customerData.postalCode || '',
        country: customerData.country || 'Canada',
        phoneNumbers: mappedPhones,
      }));
    } catch (error) {
      console.error('Error fetching customer data:', error);
      // Not critical - user can still fill in manually
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 'selectUser') {
      if (!formData.userId) newErrors.userId = 'Please select a user';
      if (!formData.employeeType) newErrors.employeeType = 'Please select an employee type';
    } else {
      // Name fields are read-only from user account, no need to validate
      if (!formData.streetAddress.trim()) newErrors.streetAddress = 'Street address is required';
      if (!formData.city.trim()) newErrors.city = 'City is required';
      if (!formData.postalCode.trim()) newErrors.postalCode = 'Postal code is required';
      if (formData.phoneNumbers.some(p => !p.number.trim())) {
        newErrors.phoneNumbers = 'All phone numbers must be filled';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateForm()) return;

    if (step === 'selectUser') {
      // Move to details step
      setStep('enterDetails');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('authToken');

      // Step 1: Create employee record in backend FIRST
      // This validates business rules (e.g., customer has no appointments)
      const employeeAddress: EmployeeAddress = {
        streetAddress: formData.streetAddress,
        city: formData.city,
        province: formData.province,
        country: formData.country,
        postalCode: formData.postalCode,
      };

      let phoneNumbers: EmployeePhoneNumber[] = formData.phoneNumbers
        .filter(p => p.number.trim() !== '')
        .map(p => ({
          number: p.number,
          type: p.type as EmployeePhoneType,
        }));
      
      // Backend requires at least one phone number, so add a default if none provided
      if (phoneNumbers.length === 0) {
        phoneNumbers = [{ number: 'N/A', type: 'MOBILE' }];
      }

      const employeeRole: EmployeeRole = {
        employeeRoleType: formData.employeeType as EmployeeRoleType,
      };

      const employeeData: EmployeeRequestModel = {
        userId: formData.userId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        employeeAddress: employeeAddress,
        phoneNumbers: phoneNumbers,
        employeeRole: employeeRole,
      };

      console.log('Sending employee data to backend:', employeeData);
      await addEmployee(employeeData);
      console.log('Employee created successfully in backend');

      // Step 2: Only update auth-service role AFTER backend succeeds
      const authResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/assign-employee`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: formData.userId,
            employeeType: formData.employeeType,
          }),
        }
      );

      if (!authResponse.ok) {
        const errorData = await authResponse.json();
        // Backend succeeded but auth failed - this is a problem but employee exists
        console.error('Warning: Employee created but auth-service update failed:', errorData);
        throw new Error(errorData.error || 'Employee created but failed to update auth role');
      }
      console.log('Auth-service role updated successfully');

      onClose();
      onSuccess?.();
      
      // Reset form
      setStep('selectUser');
      setSelectedUser(null);
      setFormData({
        userId: '',
        employeeType: EMPLOYEE_TYPES[0] || 'TECHNICIAN',
        firstName: '',
        lastName: '',
        streetAddress: '',
        city: '',
        province: provinces[0] || '',
        country: 'Canada',
        postalCode: '',
        phoneNumbers: [{ number: '', type: 'MOBILE' }],
      });
    } catch (error: unknown) {
      console.error('Error assigning employee:', error);
      setSubmitError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay-light">
      <div className="modal-container-light employee-modal">
        <div className="modal-header-light">
          <h3>Add Employee {step === 'enterDetails' && `- Step 2`}</h3>
          <button className="modal-close-light" onClick={onClose}>
            &#10005;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="employee-form">
          {submitError && <div className="form-error-message">{submitError}</div>}
          {fetchError && <div className="form-error-message">{fetchError}</div>}

          {step === 'selectUser' && (
            <>
              {fetchError && (
                <div className="form-error-message">{fetchError}</div>
              )}

              {searchQuery.trim().length > 0 && searchQuery.trim().length < 2 && (
                <div className="form-info-message">Type at least 2 characters to search</div>
              )}

              <div className="form-section">
                <h4 className="form-section-title">Step 1: Select User and Employee Type</h4>
                
                <div className="form-group">
                  <label htmlFor="userSearch">Search User *</label>
                  <input
                    type="text"
                    id="userSearch"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={errors.userId ? 'input-error' : ''}
                  />
                  {errors.userId && <span className="field-error">{errors.userId}</span>}
                </div>

                {searchQuery.trim() && (
                  <div className="user-search-results">
                    {filteredUsers.length === 0 ? (
                      <div className="search-no-results">No users found matching "{searchQuery}"</div>
                    ) : (
                      <div className="user-list">
                        {filteredUsers.map(user => (
                          <div
                            key={user.id}
                            className="user-list-item"
                            onClick={() => {
                              handleUserSelect(user.id);
                              setSearchQuery('');
                            }}
                          >
                            <div className="user-name">{user.name}</div>
                            <div className="user-email">{user.email}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="employeeType">Employee Type *</label>
                  <select
                    id="employeeType"
                    name="employeeType"
                    value={formData.employeeType}
                    onChange={handleInputChange}
                    className={errors.employeeType ? 'input-error' : ''}
                  >
                    {EMPLOYEE_TYPES.map(type => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  {errors.employeeType && <span className="field-error">{errors.employeeType}</span>}
                </div>
              </div>
            </>
          )}

          {step === 'enterDetails' && selectedUser && (
            <>
              <div className="form-info-message">
                Assigning: {selectedUser.name} ({selectedUser.email}) as {formData.employeeType}
              </div>

              <div className="form-section">
                <h4 className="form-section-title">Personal Information</h4>
                <div className="form-group">
                  <label htmlFor="firstName">First Name *</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    readOnly
                    disabled
                    placeholder="Enter first name"
                    className="input-disabled"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="lastName">Last Name *</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    readOnly
                    disabled
                    placeholder="Enter last name"
                    className="input-disabled"
                  />
                  {errors.lastName && <span className="field-error">{errors.lastName}</span>}
                </div>
              </div>

              <div className="form-section">
                <h4 className="form-section-title">Address</h4>
                <div className="form-group">
                  <label htmlFor="streetAddress">Street Address *</label>
                  <input
                    type="text"
                    id="streetAddress"
                    name="streetAddress"
                    value={formData.streetAddress}
                    disabled
                    placeholder="Enter street address"
                    className="input-disabled"
                  />
                  {errors.streetAddress && <span className="field-error">{errors.streetAddress}</span>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="province">Province *</label>
                    <select
                      id="province"
                      name="province"
                      value={formData.province}
                      disabled
                    >
                      {provinces.map(province => (
                        <option key={province} value={province}>
                          {province}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="city">City *</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      disabled
                      placeholder="Enter your city"
                      className="input-disabled"
                    />
                    {errors.city && <span className="field-error">{errors.city}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="postalCode">Postal Code *</label>
                  <input
                    type="text"
                    id="postalCode"
                    name="postalCode"
                    value={formData.postalCode}
                    disabled
                    placeholder="e.g., M5V 3A8"
                    className="input-disabled"
                  />
                  {errors.postalCode && <span className="field-error">{errors.postalCode}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="country">Country *</label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={formData.country}
                    disabled
                    className="input-disabled"
                  />
                </div>
              </div>

              <div className="form-section">
                <h4 className="form-section-title">Phone Numbers</h4>
                {formData.phoneNumbers.map((phone, index) => (
                  <div key={index} className="phone-group">
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor={`phoneNumber-${index}`}>Phone Number *</label>
                        <input
                          type="tel"
                          id={`phoneNumber-${index}`}
                          value={phone.number}
                          disabled
                          placeholder="(555) 555-5555"
                          className="input-disabled"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor={`phoneType-${index}`}>Type *</label>
                        <select
                          id={`phoneType-${index}`}
                          value={phone.type}
                          disabled
                        >
                          {phoneTypes.map(type => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>

                      {formData.phoneNumbers.length > 1 && (
                        <button
                          type="button"
                          className="btn-remove-phone"
                          onClick={() => removePhoneField(index)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {errors.phoneNumbers && <span className="field-error">{errors.phoneNumbers}</span>}
              </div>
            </>
          )}

          {/* Buttons */}
          <div className="form-actions">
            {step === 'enterDetails' && (
              <button
                type="button"
                onClick={() => setStep('selectUser')}
                className="btn-cancel"
              >
                Back
              </button>
            )}
            <button
              type="submit"
              disabled={loading || (step === 'selectUser' && unassignedUsers.length === 0)}
              className="btn-submit"
            >
              {loading ? 'Creating...' : step === 'selectUser' ? 'Next' : 'Create Employee'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-cancel"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
