import { useState, useEffect } from 'react';
import { getErrorMessage } from '../shared/api/errorHandler';
import './EmployeeAddModal.css';

interface UnassignedUser {
  id: string;
  email: string;
  name: string;
}

interface EmployeeAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const EMPLOYEE_TYPES = ['TECHNICIAN', 'MANAGER', 'SUPERVISOR', 'SUPPORT'];

export default function EmployeeAssignModal({ isOpen, onClose, onSuccess }: EmployeeAssignModalProps) {
  const [formData, setFormData] = useState({
    userId: '',
    employeeType: EMPLOYEE_TYPES[0] || '',
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
    }
  }, [isOpen]);

  const fetchUnassignedUsers = async () => {
    try {
      setFetchError('');
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `${import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:3001'}/api/auth/unassigned-users`,
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

  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.userId.trim()) newErrors.userId = 'Please select a user';
    if (!formData.employeeType.trim()) newErrors.employeeType = 'Please select an employee type';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        `${import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:3001'}/api/auth/assign-employee`,
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign employee');
      }

      onClose();
      onSuccess?.();
      
      // Reset form
      setFormData({
        userId: '',
        employeeType: EMPLOYEE_TYPES[0] || '',
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
          <h3>Assign Employee from Existing Account</h3>
          <button className="modal-close-light" onClick={onClose}>
            &#10005;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="employee-form">
          {submitError && <div className="form-error-message">{submitError}</div>}
          {fetchError && <div className="form-error-message">{fetchError}</div>}

          {unassignedUsers.length === 0 && !fetchError && (
            <div className="form-info-message">No unassigned users available</div>
          )}

          <div className="form-section">
            <h4 className="form-section-title">Select User and Employee Type</h4>
            
            <div className="form-group">
              <label htmlFor="userId">Select User *</label>
              <select
                id="userId"
                name="userId"
                value={formData.userId}
                onChange={handleInputChange}
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

          {/* Buttons */}
          <div className="form-actions">
            <button
              type="submit"
              disabled={loading || unassignedUsers.length === 0}
              className="btn-submit"
            >
              {loading ? 'Assigning...' : 'Assign Employee'}
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
