import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { EmployeeRequestModel } from '../features/employee/models/EmployeeRequestModel';
import type { EmployeeResponseModel } from '../features/employee/models/EmployeeResponseModel';
import type { EmployeePhoneNumber } from '../features/employee/models/EmployeePhoneNumber';
import type { EmployeeRole, EmployeeRoleType } from '../features/employee/models/EmployeeRole';
import type { EmployeeAddress } from '../features/employee/models/EmployeeAddress';
import type { EmployeePhoneType } from '../features/employee/models/EmployeePhoneType';
import { updateEmployee } from '../features/employee/api/updateEmployee';
import { getErrorMessage } from '../shared/api/errorHandler';
import { getPostalCodeError } from '../utils/postalCodeValidator';
import './EmployeeAddModal.css';

interface EmployeeEditModalProps {
  isOpen: boolean;
  employee: EmployeeResponseModel;
  onClose: () => void;
  onSuccess?: () => void;
}

const provinces = [
  'Ontario',
  'Quebec',
  'British Columbia',
  'Alberta',
  'Manitoba',
  'Saskatchewan',
  'Nova Scotia',
];
const roles: EmployeeRoleType[] = ['ADMIN', 'TECHNICIAN', 'SUPPORT', 'SALES'];
const phoneTypes = ['MOBILE', 'HOME', 'WORK'];

export default function EmployeeEditModal({
  isOpen,
  employee,
  onClose,
  onSuccess,
}: EmployeeEditModalProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    userId: '',
    streetAddress: '',
    city: '',
    province: provinces[0] || '',
    country: 'Canada',
    postalCode: '',
    phoneNumbers: [{ number: '', type: 'MOBILE' }],
    role: roles[0],
  });
  // Track original role to enforce allowed transitions on the UI
  const [originalRole, setOriginalRole] = useState<EmployeeRoleType>('SUPPORT');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (employee) {
      // Extract role type
      const roleType =
        typeof employee.employeeRole === 'object'
          ? (employee.employeeRole as unknown as { employeeRoleType: EmployeeRoleType })
              .employeeRoleType
          : (employee.employeeRole as EmployeeRoleType);

      // Extract phone numbers
      const phones = employee.phoneNumbers?.map((phone) => ({
        number: phone.number,
        type:
          typeof phone.type === 'object'
            ? (phone.type as unknown as { phoneType: EmployeePhoneType }).phoneType
            : (phone.type as string),
      })) || [{ number: '', type: 'MOBILE' }];

      setFormData({
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        userId: employee.userId || '',
        streetAddress: employee.employeeAddress?.streetAddress || '',
        city: employee.employeeAddress?.city || '',
        province: employee.employeeAddress?.province || provinces[0],
        country: employee.employeeAddress?.country || 'Canada',
        postalCode: employee.employeeAddress?.postalCode || '',
        phoneNumbers: phones.length > 0 ? phones : [{ number: '', type: 'MOBILE' }],
        role: roleType,
      });
      setOriginalRole(roleType);
    }
  }, [employee]);

  // Determine allowed role options based on original role
  const allowedRoles: EmployeeRoleType[] = (() => {
    const isOriginalTech = originalRole === 'TECHNICIAN';
    if (isOriginalTech) {
      // Technician can only remain Technician
      return ['TECHNICIAN'];
    }
    // Non-technicians can switch among ADMIN/SUPPORT/SALES, but cannot become TECHNICIAN
    return ['ADMIN', 'SUPPORT', 'SALES'];
  })();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Validate postal code on change
    if (name === 'postalCode') {
      const errorKey = getPostalCodeError(value, formData.city, formData.province);
      if (errorKey) {
        const translatedError = t(errorKey, { city: formData.city, province: formData.province });
        setErrors((prev) => ({ ...prev, postalCode: translatedError }));
      }
    }
  };

  const handlePhoneChange = (index: number, field: string, value: string) => {
    const newPhones = [...formData.phoneNumbers];
    newPhones[index] = { ...newPhones[index], [field]: value };
    setFormData((prev) => ({ ...prev, phoneNumbers: newPhones }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    // userId is read-only, no need to validate
    if (!formData.streetAddress.trim()) newErrors.streetAddress = 'Street address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.postalCode.trim()) newErrors.postalCode = 'Postal code is required';
    else {
      const postalErrorKey = getPostalCodeError(
        formData.postalCode,
        formData.city,
        formData.province
      );
      if (postalErrorKey) {
        newErrors.postalCode = t(postalErrorKey, {
          city: formData.city,
          province: formData.province,
        });
      }
    }

    if (formData.phoneNumbers.some((p) => !p.number.trim())) {
      newErrors.phoneNumbers = 'All phone numbers must be filled';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      const employeeId = (
        employee.employeeIdentifier as EmployeeResponseModel['employeeIdentifier'] &
          Record<string, unknown>
      )?.employeeId;

      if (!employeeId) {
        throw new Error('Employee ID not found');
      }

      const employeeAddress: EmployeeAddress = {
        streetAddress: formData.streetAddress,
        city: formData.city,
        province: formData.province,
        country: formData.country,
        postalCode: formData.postalCode,
      };

      const phoneNumbers: EmployeePhoneNumber[] = formData.phoneNumbers.map((p) => ({
        number: p.number,
        type: p.type as EmployeePhoneType,
      }));

      const employeeRole: EmployeeRole = {
        employeeRoleType: formData.role as EmployeeRoleType,
      };

      const employeeData: EmployeeRequestModel = {
        userId: formData.userId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        employeeAddress: employeeAddress,
        phoneNumbers: phoneNumbers,
        employeeRole: employeeRole,
      };

      await updateEmployee(String(employeeId), employeeData);
      onClose();
      onSuccess?.();
    } catch (error: unknown) {
      console.error('Error updating employee:', error);
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
          <h3>{t('pages.employees.editEmployee')}</h3>
          <button className="modal-close-light" onClick={onClose}>
            &#10005;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="employee-form">
          {submitError && <div className="form-error-message">{submitError}</div>}

          {/* Personal Information */}
          <div className="form-section">
            <h4 className="form-section-title">{t('pages.employees.personalInformation')}</h4>
            <div className="form-group">
              <label htmlFor="firstName">{t('auth.firstName')} *</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="Enter first name"
                className={errors.firstName ? 'input-error' : ''}
                disabled
              />
              {errors.firstName && <span className="field-error">{errors.firstName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="lastName">{t('auth.lastName')} *</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Enter last name"
                className={errors.lastName ? 'input-error' : ''}
                disabled
              />
              {errors.lastName && <span className="field-error">{errors.lastName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="role">{t('pages.employees.role')} *</label>
              <select id="role" name="role" value={formData.role} onChange={handleInputChange}>
                {allowedRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              <span className="field-info" style={{ fontSize: '0.85rem', color: '#6b6b6b' }}>
                {originalRole === 'TECHNICIAN'
                  ? t('pages.employees.technicianCannotChange')
                  : t('pages.employees.nonTechnicianCanSwitch')}
              </span>
            </div>
          </div>

          {/* Address Information */}
          <div className="form-section">
            <h4 className="form-section-title">{t('pages.employees.address')}</h4>
            <div className="form-group">
              <label htmlFor="streetAddress">{t('pages.employees.streetAddress')} *</label>
              <input
                type="text"
                id="streetAddress"
                name="streetAddress"
                value={formData.streetAddress}
                onChange={handleInputChange}
                placeholder="Enter street address"
                className={errors.streetAddress ? 'input-error' : ''}
                disabled
              />
              {errors.streetAddress && <span className="field-error">{errors.streetAddress}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="province">{t('pages.employees.province')} *</label>
                <select
                  id="province"
                  name="province"
                  value={formData.province}
                  onChange={handleInputChange}
                  disabled
                >
                  {provinces.map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="city">{t('pages.employees.city')} *</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="Enter your city"
                  className={errors.city ? 'input-error' : ''}
                  disabled
                />
                {errors.city && <span className="field-error">{errors.city}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="postalCode">{t('pages.employees.postalCode')} *</label>
              <input
                type="text"
                id="postalCode"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleInputChange}
                placeholder="e.g., M5V 3A8"
                className={errors.postalCode ? 'input-error' : ''}
                disabled
              />
              {errors.postalCode && <span className="field-error">{errors.postalCode}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="country">{t('pages.employees.country')} *</label>
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

          {/* Phone Numbers */}
          <div className="form-section">
            <h4 className="form-section-title">{t('pages.employees.phoneNumbers')}</h4>
            {formData.phoneNumbers.map((phone, index) => (
              <div key={index} className="phone-group">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor={`phoneNumber-${index}`}>
                      {t('pages.employees.phoneNumber')} *
                    </label>
                    <input
                      type="tel"
                      id={`phoneNumber-${index}`}
                      value={phone.number}
                      onChange={(e) => handlePhoneChange(index, 'number', e.target.value)}
                      placeholder="(555) 555-5555"
                      className={errors.phoneNumbers ? 'input-error' : ''}
                      disabled
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor={`phoneType-${index}`}>{t('pages.employees.phoneType')} *</label>
                    <select
                      id={`phoneType-${index}`}
                      value={phone.type}
                      onChange={(e) => handlePhoneChange(index, 'type', e.target.value)}
                      disabled
                    >
                      {phoneTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
            {errors.phoneNumbers && <span className="field-error">{errors.phoneNumbers}</span>}
          </div>

          {/* Buttons */}
          <div className="form-actions">
            <button type="submit" disabled={loading} className="btn-submit">
              {loading ? 'Updating...' : 'Update Employee'}
            </button>
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
