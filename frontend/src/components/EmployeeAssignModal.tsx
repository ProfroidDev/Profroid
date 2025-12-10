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
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [fetchError, setFetchError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch unassigned users when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUnassignedUsers();
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
    }
  }, [isOpen]);

  const fetchUnassignedUsers = async () => {
    try {
      setFetchError('');
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/unassigned-users`,
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

      const data = await response.json();
      setUnassignedUsers(data.users || []);
    } catch (error: unknown) {
      console.error('Error fetching unassigned users:', error);
      setFetchError(getErrorMessage(error));
    }
  };

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

  const handlePhoneChange = (index: number, field: string, value: string) => {
    const newPhones = [...formData.phoneNumbers];
    newPhones[index] = { ...newPhones[index], [field]: value };
    setFormData(prev => ({ ...prev, phoneNumbers: newPhones }));
  };

  const addPhoneField = () => {
    setFormData(prev => ({
      ...prev,
      phoneNumbers: [...prev.phoneNumbers, { number: '', type: 'MOBILE' }],
    }));
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

      // Step 1: Assign employee type in auth-service
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
        throw new Error(errorData.error || 'Failed to assign employee');
      }

      // Step 2: Update customer record with address and phone if available
      // This saves the customer's data from the employee form
      if (formData.streetAddress || formData.phoneNumbers.some(p => p.number)) {
        try {
          const customerUpdateData = {
            userId: formData.userId,
            firstName: formData.firstName,
            lastName: formData.lastName,
            streetAddress: formData.streetAddress,
            city: formData.city,
            province: formData.province,
            country: formData.country,
            postalCode: formData.postalCode,
            phoneNumbers: formData.phoneNumbers.map(p => ({
              number: p.number,
              type: p.type,
            })),
          };

          const customerResponse = await fetch(
            `${import.meta.env.VITE_BACKEND_URL}/customers/by-user/${formData.userId}`,
            {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(customerUpdateData),
            }
          );

          if (!customerResponse.ok) {
            console.warn('Failed to update customer record, but continuing with employee assignment');
          }
        } catch (error) {
          console.warn('Error updating customer record:', error);
          // Not critical - continue with employee assignment
        }
      }

      // Step 3: Create employee record in backend
      const employeeAddress: EmployeeAddress = {
        streetAddress: formData.streetAddress,
        city: formData.city,
        province: formData.province,
        country: formData.country,
        postalCode: formData.postalCode,
      };

      const phoneNumbers: EmployeePhoneNumber[] = formData.phoneNumbers.map(p => ({
        number: p.number,
        type: p.type as EmployeePhoneType,
      }));

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

      await addEmployee(employeeData);

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
              {unassignedUsers.length === 0 && !fetchError && (
                <div className="form-info-message">No unassigned users available</div>
              )}

              <div className="form-section">
                <h4 className="form-section-title">Step 1: Select User and Employee Type</h4>
                
                <div className="form-group">
                  <label htmlFor="userId">Select User *</label>
                  <select
                    id="userId"
                    name="userId"
                    value={formData.userId}
                    onChange={(e) => handleUserSelect(e.target.value)}
                    className={errors.userId ? 'input-error' : ''}
                    disabled={unassignedUsers.length === 0}
                  >
                    <option value="">-- Choose a user --</option>
                    {unassignedUsers.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                  {errors.userId && <span className="field-error">{errors.userId}</span>}
                </div>

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
                    onChange={handleInputChange}
                    placeholder="Enter street address"
                    className={errors.streetAddress ? 'input-error' : ''}
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
                      onChange={handleInputChange}
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
                      onChange={handleInputChange}
                      placeholder="Enter your city"
                      className={errors.city ? 'input-error' : ''}
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
                    onChange={handleInputChange}
                    placeholder="e.g., M5V 3A8"
                    className={errors.postalCode ? 'input-error' : ''}
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
                          onChange={(e) => handlePhoneChange(index, 'number', e.target.value)}
                          placeholder="(555) 555-5555"
                          className={errors.phoneNumbers ? 'input-error' : ''}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor={`phoneType-${index}`}>Type *</label>
                        <select
                          id={`phoneType-${index}`}
                          value={phone.type}
                          onChange={(e) => handlePhoneChange(index, 'type', e.target.value)}
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

                <button
                  type="button"
                  className="btn-add-phone"
                  onClick={addPhoneField}
                >
                  + Add Another Phone
                </button>
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
