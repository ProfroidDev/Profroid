import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useAuthStore from "../../features/authentication/store/authStore";
import "../Auth.css";
import "../jobs/ServicesPage.css"; // Import ServicesPage styles for modal
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../Employee/EmployeeListPage.css";
import Toast from "../../shared/components/Toast";
import { getEmployeeScheduleForDate } from "../../features/employee/api/getEmployeeScheduleForDate";
import type { EmployeeSchedule } from "../../features/employee/models/EmployeeSchedule";

type PhoneNumber = {
  number?: string;
  type?: string;
};

type Address = {
  streetAddress?: string;
  city?: string;
  province?: string;
  country?: string;
  postalCode?: string;
};

type CustomerData = {
  firstName?: string;
  lastName?: string;
  streetAddress?: string;
  city?: string;
  province?: string;
  country?: string;
  postalCode?: string;
  phoneNumbers?: PhoneNumber[];
  employeeIdentifier?: { employeeId?: string };
  employeeAddress?: Address;
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const {
    user,
    changePassword,
    logout,
    isLoading,
    error,
    clearError,
    customerData: storedCustomerData,
    setCustomerData: setStoredCustomerData,
  } = useAuthStore();

  const [editMode, setEditMode] = useState(false);
  const [passwordMode, setPasswordMode] = useState(false);
  const [formError, setFormError] = useState("");

  // Profile form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [country, setCountry] = useState("");

  // Password form state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Schedule state (for employees)
  const [schedule, setSchedule] = useState<Record<string, unknown>[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDateSchedule, setSelectedDateSchedule] =
    useState<EmployeeSchedule | null>(null);

  // Employee identifiers for schedule and updates
  const [employeeId, setEmployeeId] = useState<string | null>(null);

  // Customer data state (address, phone, etc.)
  const [customerData, setCustomerData] = useState<CustomerData | null>(
    storedCustomerData || null
  );

  // Cellar intake form state
  const [addCellarModalOpen, setAddCellarModalOpen] = useState(false);
  const [editCellarModalOpen, setEditCellarModalOpen] = useState(false);
  const [editingCellarId, setEditingCellarId] = useState<string | null>(null);
  const [cellarName, setCellarName] = useState("");
  const [cellarHeight, setCellarHeight] = useState("");
  const [cellarWidth, setCellarWidth] = useState("");
  const [cellarDepth, setCellarDepth] = useState("");
  const [cellarBottleCapacity, setCellarBottleCapacity] = useState("");
  const [cellarType, setCellarType] = useState("PRIVATE");
  const [cellarCoolingSystem, setCellarCoolingSystem] = useState(false);
  const [cellarHumidityControl, setCellarHumidityControl] = useState(false);
  const [cellarAutoRegulation, setCellarAutoRegulation] = useState(false);
  const [cellarError, setCellarError] = useState("");
  const [cellarLoading, setCellarLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info" | "warning";
  } | null>(null);

  // Customer cellars state
  // Align to backend response fields
  type Cellar = {
    cellarId?: string;
    ownerCustomerId?: string | { customerId?: string };
    name?: string;
    height?: number;
    width?: number;
    depth?: number;
    bottleCapacity?: number;
    hasCoolingSystem?: boolean;
    hasHumidityControl?: boolean;
    hasAutoRegulation?: boolean;
    cellarType?: string;
    isActive?: boolean;
    active?: boolean;
  };
  const [cellars, setCellars] = useState<Cellar[]>([]);

  // Fetch customer data and employee schedule when component loads or user role changes
  const fetchEmployeeData = useCallback(async () => {
    if (!user?.id) return;

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/employees/by-user/${user.id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data: CustomerData = await response.json();
        setCustomerData(data); // Reuse customerData state for employee data
        setFirstName(data.firstName || "");
        setLastName(data.lastName || "");
        if (data.employeeIdentifier?.employeeId) {
          setEmployeeId(data.employeeIdentifier.employeeId);
        }
        // Update form fields with employee data
        if (data.employeeAddress?.streetAddress)
          setAddress(data.employeeAddress.streetAddress);
        if (data.employeeAddress?.city) setCity(data.employeeAddress.city);
        if (data.employeeAddress?.province)
          setProvince(data.employeeAddress.province);
        if (data.employeeAddress?.country)
          setCountry(data.employeeAddress.country);
        if (data.employeeAddress?.postalCode)
          setPostalCode(data.employeeAddress.postalCode);
        // Extract phone number from phoneNumbers array
        if (data.phoneNumbers && data.phoneNumbers.length > 0) {
          setPhone(data.phoneNumbers[0].number || "");
        }
      } else if (response.status === 404) {
        // No employee record yet; clear employee-specific state
        setEmployeeId(null);
        setSchedule([]);
      }
    } catch (error) {
      console.error("Error fetching employee data:", error);
    }
  }, [user?.id]);

  const fetchCustomerDataLocally = useCallback(async () => {
    if (!user?.id || user?.employeeType) return;

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/customers/by-user/${user.id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data: CustomerData = await response.json();
        setCustomerData(data);
        setStoredCustomerData(data); // Also update store
        setFirstName(data.firstName || "");
        setLastName(data.lastName || "");
        // Update form fields with customer data
        if (data.streetAddress) setAddress(data.streetAddress);
        if (data.city) setCity(data.city);
        if (data.province) setProvince(data.province);
        if (data.country) setCountry(data.country);
        if (data.postalCode) setPostalCode(data.postalCode);
        // Extract phone number from phoneNumbers array
        if (data.phoneNumbers && data.phoneNumbers.length > 0) {
          setPhone(data.phoneNumbers[0].number || "");
        }
      }
    } catch (error) {
      console.error("Error fetching customer data:", error);
    }
  }, [user?.id, user?.employeeType, setStoredCustomerData]);

  const fetchCustomerData = fetchCustomerDataLocally;

  // Guard to avoid duplicate fetches in React 18 StrictMode (dev)
  const didInitialLoadRef = useRef(false);

  // Fetch cellars for the authenticated customer
  const fetchCellarsForCustomer = useCallback(async () => {
    if (!user?.id) return;
    try {
      const token = localStorage.getItem("authToken");
      // Prefer filtering by customerId if backend supports it; otherwise fetch all and filter client-side
      const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/cellars`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (resp.ok) {
        const list: Cellar[] = await resp.json();
        // If response contains ownerCustomerId.customerId, filter to current user’s customerId if available
        // Fallback: keep entire list; backend @PreAuthorize already limits visibility per role
        setCellars(Array.isArray(list) ? list : []);
      }
    } catch (e) {
      console.error("Error fetching cellars:", e);
    }
  }, [user?.id]);

  // Load cellars when user is customer
  useEffect(() => {
    if (user && !user?.employeeType) {
      fetchCellarsForCustomer();
    }
  }, [user, fetchCellarsForCustomer]);

  // Load appropriate data based on user type: employee or customer
  useEffect(() => {
    if (!user?.id) return;

    // Prevent duplicate invocation in dev StrictMode
    if (didInitialLoadRef.current) return;
    didInitialLoadRef.current = true;

    if (user?.employeeType) {
      // User is an employee - fetch employee data
      // Clear customer data if user was previously a customer
      if (storedCustomerData) {
        setStoredCustomerData(null);
      }
      fetchEmployeeData();
    } else if (!storedCustomerData) {
      // User is a customer - fetch customer data
      fetchCustomerData();
    }
  }, [
    user?.id,
    user?.employeeType,
    storedCustomerData,
    fetchCustomerData,
    fetchEmployeeData,
    setStoredCustomerData,
  ]);

  const fetchEmployeeSchedule = useCallback(async () => {
    if (!employeeId) return; // Only fetch schedule if we have an employeeId

    try {
      setScheduleLoading(true);
      setScheduleError("");
      const token = localStorage.getItem("authToken");

      // Fetch schedule for this employee using the employeeId we already have
      const scheduleResponse = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/employees/${employeeId}/schedules`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (scheduleResponse.ok) {
        const scheduleData = await scheduleResponse.json();
        console.log("Schedule data:", scheduleData); // Debug log
        setSchedule(scheduleData || []);
      } else {
        console.error(
          "Schedule fetch failed with status:",
          scheduleResponse.status
        );
        setSchedule([]);
      }
    } catch (error) {
      console.error("Error fetching schedule:", error);
      setScheduleError("Failed to load schedule");
    } finally {
      setScheduleLoading(false);
    }
  }, [employeeId]);

  // Keep selectedDateSchedule in sync when selectedDate changes
  useEffect(() => {
    async function syncSelectedDate() {
      if (!selectedDate) {
        setSelectedDateSchedule(null);
        return;
      }
      // Try date-specific schedule first
      try {
        if (employeeId) {
          const yyyy = selectedDate.getFullYear();
          const mm = String(selectedDate.getMonth() + 1).padStart(2, "0");
          const dd = String(selectedDate.getDate()).padStart(2, "0");
          const formatted = `${yyyy}-${mm}-${dd}`;
          const dateSched = await getEmployeeScheduleForDate(
            employeeId,
            formatted
          );
          if (dateSched && dateSched.length > 0) {
            setSelectedDateSchedule(dateSched[0]);
            return;
          }
        }
      } catch {
        // fall through to weekly template
      }
      // Fallback to weekly template from loaded schedule
      const dayOfWeek = selectedDate
        .toLocaleDateString("en-US", { weekday: "long" })
        .toUpperCase();
      const weekly = (schedule || []).find(
        (s: Record<string, unknown>) =>
          ((s.dayOfWeek as string) || "")?.toUpperCase() === dayOfWeek
      );
      setSelectedDateSchedule((weekly as unknown as EmployeeSchedule) || null);
    }
    syncSelectedDate();
  }, [selectedDate, employeeId, schedule]);

  useEffect(() => {
    if (user?.id && storedCustomerData) {
      // Initialize form with stored customer data
      setCustomerData(storedCustomerData);
      setFirstName(storedCustomerData.firstName || "");
      setLastName(storedCustomerData.lastName || "");
      if (storedCustomerData.streetAddress)
        setAddress(storedCustomerData.streetAddress);
      if (storedCustomerData.city) setCity(storedCustomerData.city);
      if (storedCustomerData.province) setProvince(storedCustomerData.province);
      if (storedCustomerData.country) setCountry(storedCustomerData.country);
      if (storedCustomerData.postalCode)
        setPostalCode(storedCustomerData.postalCode);
      if (
        storedCustomerData.phoneNumbers &&
        storedCustomerData.phoneNumbers.length > 0
      ) {
        setPhone(storedCustomerData.phoneNumbers[0].number || "");
      }

      // Auto-enable edit mode if customer data is empty (no firstName/lastName)
      if (!storedCustomerData.firstName && !storedCustomerData.lastName) {
        setEditMode(true);
      }
    }
  }, [user?.id, storedCustomerData]);

  // Once we have the employeeId from fetchEmployeeData, load the schedule
  useEffect(() => {
    if (employeeId) {
      fetchEmployeeSchedule();
      // Auto-select today after initial load
      setSelectedDate(new Date());
    }
  }, [employeeId, fetchEmployeeSchedule]);

  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <p>Please log in to view your profile</p>
          <button onClick={() => navigate("/login")} className="btn-primary">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    clearError();

    try {
      const token = localStorage.getItem("authToken");

      if (user?.employeeType) {
        // Save employee data
        const resolvedEmployeeId =
          employeeId ||
          (
            customerData as {
              employeeIdentifier?: { employeeId?: string };
            } | null
          )?.employeeIdentifier?.employeeId;

        const employeeUpdateData = {
          userId: user.id, // Include userId so backend can verify ownership
          firstName: firstName || "",
          lastName: lastName || "",
          employeeAddress: {
            streetAddress: address,
            city: city,
            province: province,
            country: country,
            postalCode: postalCode,
          },
          phoneNumbers: phone
            ? [{ number: phone, type: "WORK" }]
            : customerData?.phoneNumbers || [],
          // Do not include employeeRole - backend will preserve it for non-admin users
        };

        if (!resolvedEmployeeId) {
          throw new Error(
            "No employee record found for this user. Assign the user as an employee first."
          );
        }

        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/employees/${resolvedEmployeeId}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(employeeUpdateData),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to save employee data");
        }

        const updatedData = await response.json();
        setCustomerData(updatedData);
        setStoredCustomerData(updatedData); // Also update store so data persists
      } else {
        // Save customer data
        const customerUpdateData = {
          userId: user.id,
          firstName: firstName || "",
          lastName: lastName || "",
          streetAddress: address,
          city: city,
          province: province,
          country: country,
          postalCode: postalCode,
          // Backend PhoneType enum allows WORK, MOBILE, HOME; use MOBILE for customers.
          phoneNumbers: phone
            ? [{ number: phone, type: "MOBILE" }]
            : customerData?.phoneNumbers || [],
        };

        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/customers/by-user/${user.id}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(customerUpdateData),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to save customer data");
        }

        const updatedData = await response.json();
        setCustomerData(updatedData);
        setStoredCustomerData(updatedData); // Also update store so data persists
      }

      setEditMode(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      setFormError("Failed to save profile changes");
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    clearError();

    if (!oldPassword || !newPassword || !confirmPassword) {
      setFormError("Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setFormError("Password must be at least 6 characters");
      return;
    }

    const success = await changePassword(oldPassword, newPassword);
    if (success) {
      setPasswordMode(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleCellarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCellarError("");

    // Validate required fields
    if (!cellarName.trim()) {
      setCellarError("Cellar name is required");
      return;
    }

    if (!cellarHeight || !cellarWidth || !cellarDepth) {
      setCellarError("Cellar dimensions are required");
      return;
    }

    if (!cellarBottleCapacity) {
      setCellarError("Bottle capacity is required");
      return;
    }

    try {
      setCellarLoading(true);
      const token = localStorage.getItem("authToken");

      // Get customer ID from stored customer data
      const customerId = (customerData as { customerId?: string })?.customerId;
      if (!customerId) {
        throw new Error("Customer ID not found");
      }

      const cellarData = {
        ownerCustomerId: {
          customerId: customerId,
        },
        name: cellarName.trim(),
        height: parseFloat(cellarHeight),
        width: parseFloat(cellarWidth),
        depth: parseFloat(cellarDepth),
        bottleCapacity: parseInt(cellarBottleCapacity),
        hasCoolingSystem: cellarCoolingSystem,
        hasHumidityControl: cellarHumidityControl,
        hasAutoRegulation: cellarAutoRegulation,
        cellarType: cellarType,
      };

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/cellars`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(cellarData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create cellar");
      }

      // Reset form
      setCellarName("");
      setCellarHeight("");
      setCellarWidth("");
      setCellarDepth("");
      setCellarBottleCapacity("");
      setCellarType("PRIVATE");
      setCellarCoolingSystem(false);
      setCellarHumidityControl(false);
      setCellarAutoRegulation(false);
      setAddCellarModalOpen(false);

      // Refresh cellars list to show the newly created cellar
      await fetchCellarsForCustomer();

      // Show success message
      setToast({
        message: "Cellar intake created successfully!",
        type: "success",
      });
    } catch (error) {
      console.error("Error creating cellar:", error);
      setCellarError("Failed to create cellar intake");
    } finally {
      setCellarLoading(false);
    }
  };

  const handleCellarEdit = (cellar: Cellar) => {
    setEditingCellarId(cellar.cellarId || null);
    setCellarName(cellar.name || "");
    setCellarHeight(cellar.height?.toString() || "");
    setCellarWidth(cellar.width?.toString() || "");
    setCellarDepth(cellar.depth?.toString() || "");
    setCellarBottleCapacity(cellar.bottleCapacity?.toString() || "");
    setCellarType(cellar.cellarType || "PRIVATE");
    setCellarCoolingSystem(cellar.hasCoolingSystem || false);
    setCellarHumidityControl(cellar.hasHumidityControl || false);
    setCellarAutoRegulation(cellar.hasAutoRegulation || false);
    setCellarError("");
    setEditCellarModalOpen(true);
  };

  const handleCellarUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCellarError("");

    if (!cellarName.trim()) {
      setCellarError("Cellar name is required");
      return;
    }

    if (!cellarHeight || !cellarWidth || !cellarDepth) {
      setCellarError("Cellar dimensions are required");
      return;
    }

    if (!cellarBottleCapacity) {
      setCellarError("Bottle capacity is required");
      return;
    }

    if (!editingCellarId) {
      setCellarError("No cellar selected for update");
      return;
    }

    try {
      setCellarLoading(true);
      const token = localStorage.getItem("authToken");

      // Get customer ID from stored customer data
      const customerId = (customerData as { customerId?: string })?.customerId;
      if (!customerId) {
        throw new Error("Customer ID not found");
      }

      const cellarUpdateData = {
        ownerCustomerId: {
          customerId: customerId,
        },
        name: cellarName.trim(),
        height: parseFloat(cellarHeight),
        width: parseFloat(cellarWidth),
        depth: parseFloat(cellarDepth),
        bottleCapacity: parseInt(cellarBottleCapacity),
        hasCoolingSystem: cellarCoolingSystem,
        hasHumidityControl: cellarHumidityControl,
        hasAutoRegulation: cellarAutoRegulation,
        cellarType: cellarType,
      };

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/cellars/${editingCellarId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(cellarUpdateData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update cellar");
      }

      // Reset form and close modal
      setCellarName("");
      setCellarHeight("");
      setCellarWidth("");
      setCellarDepth("");
      setCellarBottleCapacity("");
      setCellarType("PRIVATE");
      setCellarCoolingSystem(false);
      setCellarHumidityControl(false);
      setCellarAutoRegulation(false);
      setEditingCellarId(null);
      setEditCellarModalOpen(false);

      // Refresh cellars list
      await fetchCellarsForCustomer();

      // Show success message
      setToast({
        message: "Cellar updated successfully!",
        type: "success",
      });
    } catch (error) {
      console.error("Error updating cellar:", error);
      setCellarError("Failed to update cellar");
    } finally {
      setCellarLoading(false);
    }
  };

  const handleCellarDelete = async (cellarId: string | undefined) => {
    if (!cellarId) return;

    if (!window.confirm("Are you sure you want to delete this cellar?")) {
      return;
    }

    try {
      setCellarLoading(true);
      const token = localStorage.getItem("authToken");

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/cellars/${cellarId}/deactivate`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete cellar");
      }

      // Refresh cellars list
      await fetchCellarsForCustomer();

      // Show success message
      setToast({
        message: "Cellar deleted successfully!",
        type: "success",
      });
    } catch (error) {
      console.error("Error deleting cellar:", error);
      setToast({
        message: "Failed to delete cellar",
        type: "error",
      });
    } finally {
      setCellarLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="profile-container">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="profile-card">
        <div className="profile-header">
          <h1>{t('pages.profile.title')}</h1>
          <div style={{ display: "flex", gap: "0.5rem" }}>
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
              {t('pages.profile.refresh')}
            </button>
            <button
              onClick={handleLogout}
              className="btn-secondary"
              disabled={isLoading}
            >
              {t('common.logout')}
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
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">First Name</label>
                    <input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastName">Last Name</label>
                    <input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email (Read Only)</label>
                  <input id="email" type="email" value={user.email} disabled />
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
                  <div className="alert alert-error">{formError || error}</div>
                )}

                <div className="form-actions">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary"
                  >
                    {isLoading ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditMode(false);
                      setFirstName(customerData?.firstName || "");
                      setLastName(customerData?.lastName || "");
                      const phoneFromData =
                        customerData?.phoneNumbers?.[0]?.number || "";
                      setPhone(phoneFromData);
                      setAddress(
                        customerData?.streetAddress ||
                          customerData?.employeeAddress?.streetAddress ||
                          ""
                      );
                      setPostalCode(
                        customerData?.postalCode ||
                          customerData?.employeeAddress?.postalCode ||
                          ""
                      );
                      setCity(
                        customerData?.city ||
                          customerData?.employeeAddress?.city ||
                          ""
                      );
                      setProvince(
                        customerData?.province ||
                          customerData?.employeeAddress?.province ||
                          ""
                      );
                      setCountry(
                        customerData?.country ||
                          customerData?.employeeAddress?.country ||
                          ""
                      );
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="info-row">
                  <span className="label">First Name:</span>
                  <span className="value">
                    {customerData?.firstName || "—"}
                  </span>
                </div>

                {customerData?.phoneNumbers &&
                  customerData.phoneNumbers.length > 0 && (
                    <div className="info-row">
                      <span className="label">Phone:</span>
                      <span className="value">
                        {customerData.phoneNumbers
                          .map((p) => `${String(p.number)} (${String(p.type)})`)
                          .join(", ")}
                      </span>
                    </div>
                  )}

                {customerData &&
                  (customerData.streetAddress ||
                    customerData.employeeAddress?.streetAddress) && (
                    <div className="info-row">
                      <span className="label">Address:</span>
                      <span className="value">
                        {customerData.streetAddress ||
                          customerData.employeeAddress?.streetAddress}
                      </span>
                    </div>
                  )}

                {customerData &&
                  (customerData.city || customerData.employeeAddress?.city) && (
                    <div className="info-row">
                      <span className="label">City:</span>
                      <span className="value">
                        {customerData.city ||
                          customerData.employeeAddress?.city}
                        {(customerData.province ||
                          customerData.employeeAddress?.province) &&
                          `, ${
                            customerData.province ||
                            customerData.employeeAddress?.province
                          }`}
                      </span>
                    </div>
                  )}

                {customerData &&
                  (customerData.postalCode ||
                    customerData.employeeAddress?.postalCode) && (
                    <div className="info-row">
                      <span className="label">Postal Code:</span>
                      <span className="value">
                        {customerData.postalCode ||
                          customerData.employeeAddress?.postalCode}
                      </span>
                    </div>
                  )}

                {customerData &&
                  (customerData.country ||
                    customerData.employeeAddress?.country) && (
                    <div className="info-row">
                      <span className="label">Country:</span>
                      <span className="value">
                        {customerData.country ||
                          customerData.employeeAddress?.country}
                      </span>
                    </div>
                  )}
              </>
            )}

            <button
              onClick={() => setPasswordMode(true)}
              className="btn-secondary"
              style={{ marginTop: "1rem" }}
            >
              Change Password
            </button>

            {/* Cellar Intake Button - Only show for customers */}
            {!user?.employeeType && (
              <button
                onClick={() => setAddCellarModalOpen(true)}
                className="btn-secondary"
                style={{ marginTop: "1rem", marginLeft: "0.5rem" }}
              >
                Add Cellar Intake
              </button>
            )}

            {/* Persisted cellars list - Only show for customers */}
            {!user?.employeeType && (
              <div style={{ marginTop: "2rem" }}>
                <div className="section-header">
                  <h2>Your Cellars</h2>
                </div>
                {cellars.length === 0 ? (
                  <p>No cellars yet.</p>
                ) : (
                  <div style={{ display: "grid", gap: "0.75rem" }}>
                    {cellars.map((c) => {
                      const status =
                        c.isActive ?? c.active ? "Active" : "Inactive";
                      return (
                        <div key={c.cellarId}>
                          <div className="info-row">
                            <span className="label">Name:</span>
                            <span className="value">
                              {c.name || "Unnamed Cellar"}
                            </span>
                          </div>
                          <div className="info-row">
                            <span className="label">Status:</span>
                            <span className="value">{status}</span>
                          </div>
                          <div className="info-row">
                            <span className="label">Type:</span>
                            <span className="value">{c.cellarType}</span>
                          </div>
                          <div className="info-row">
                            <span className="label">Capacity:</span>
                            <span className="value">
                              {c.bottleCapacity} bottles
                            </span>
                          </div>
                          <div className="info-row">
                            <span className="label">Dimensions (H×W×D):</span>
                            <span className="value">
                              {c.height} × {c.width} × {c.depth} cm
                            </span>
                          </div>
                          <div className="info-row">
                            <span className="label">Features:</span>
                            <span className="value">
                              {c.hasCoolingSystem ? "Cooling" : null}
                              {c.hasHumidityControl
                                ? (c.hasCoolingSystem ? ", " : "") + "Humidity"
                                : ""}
                              {c.hasAutoRegulation
                                ? (c.hasCoolingSystem || c.hasHumidityControl
                                    ? ", "
                                    : "") + "Auto Regulation"
                                : ""}
                              {!c.hasCoolingSystem &&
                              !c.hasHumidityControl &&
                              !c.hasAutoRegulation
                                ? "None"
                                : ""}
                            </span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              gap: "0.5rem",
                              marginTop: "0.75rem",
                              marginBottom: "1rem",
                            }}
                          >
                            <button
                              onClick={() => handleCellarEdit(c)}
                              className="btn-secondary"
                              style={{ flex: 1 }}
                            >
                              Update
                            </button>
                            <button
                              onClick={() => handleCellarDelete(c.cellarId)}
                              className="btn-secondary"
                              style={{
                                flex: 1,
                                backgroundColor: "#dc3545",
                                color: "white",
                              }}
                            >
                              Delete
                            </button>
                          </div>
                          <hr
                            style={{
                              margin: "1rem 0",
                              border: "0",
                              borderTop: "1px solid #eee",
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Cellar Intake Modal - Only show for customers */}
        {!user?.employeeType && addCellarModalOpen && (
          <div className="modal-overlay" role="dialog" aria-modal>
            <div className="modal">
              <div className="modal-header">
                <h3>Add Cellar Intake</h3>
                <button
                  className="modal-close-light"
                  aria-label="Close"
                  onClick={() => {
                    setAddCellarModalOpen(false);
                    setCellarName("");
                    setCellarHeight("");
                    setCellarWidth("");
                    setCellarDepth("");
                    setCellarBottleCapacity("");
                    setCellarType("PRIVATE");
                    setCellarCoolingSystem(false);
                    setCellarHumidityControl(false);
                    setCellarAutoRegulation(false);
                    setCellarError("");
                  }}
                >
                  &#10005;
                </button>
              </div>

              {cellarError && (
                <div className="alert alert-error">{cellarError}</div>
              )}

              <form onSubmit={handleCellarSubmit} className="create-job-form">
                <div className="form-group">
                  <label htmlFor="cellarName">Cellar Name *</label>
                  <input
                    id="cellarName"
                    type="text"
                    value={cellarName}
                    onChange={(e) => setCellarName(e.target.value)}
                    placeholder="e.g., Main Wine Cellar"
                    disabled={cellarLoading}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="cellarHeight">Height (cm) *</label>
                    <input
                      id="cellarHeight"
                      type="number"
                      step="0.1"
                      value={cellarHeight}
                      onChange={(e) => setCellarHeight(e.target.value)}
                      placeholder="200"
                      disabled={cellarLoading}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="cellarWidth">Width (cm) *</label>
                    <input
                      id="cellarWidth"
                      type="number"
                      step="0.1"
                      value={cellarWidth}
                      onChange={(e) => setCellarWidth(e.target.value)}
                      placeholder="300"
                      disabled={cellarLoading}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="cellarDepth">Depth (cm) *</label>
                    <input
                      id="cellarDepth"
                      type="number"
                      step="0.1"
                      value={cellarDepth}
                      onChange={(e) => setCellarDepth(e.target.value)}
                      placeholder="250"
                      disabled={cellarLoading}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="cellarBottleCapacity">
                      Bottle Capacity *
                    </label>
                    <input
                      id="cellarBottleCapacity"
                      type="number"
                      value={cellarBottleCapacity}
                      onChange={(e) => setCellarBottleCapacity(e.target.value)}
                      placeholder="500"
                      disabled={cellarLoading}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="cellarType">Cellar Type</label>
                  <select
                    id="cellarType"
                    value={cellarType}
                    onChange={(e) => setCellarType(e.target.value)}
                    disabled={cellarLoading}
                  >
                    <option value="PRIVATE">Private</option>
                    <option value="COMMERCIAL">Commercial</option>
                    <option value="PROFESSIONAL">Professional</option>
                    <option value="MODULAR">Modular</option>
                  </select>
                </div>

                <div
                  className="form-group"
                  style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={cellarCoolingSystem}
                      onChange={(e) => setCellarCoolingSystem(e.target.checked)}
                      disabled={cellarLoading}
                    />
                    Has Cooling System
                  </label>

                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={cellarHumidityControl}
                      onChange={(e) =>
                        setCellarHumidityControl(e.target.checked)
                      }
                      disabled={cellarLoading}
                    />
                    Has Humidity Control
                  </label>

                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={cellarAutoRegulation}
                      onChange={(e) =>
                        setCellarAutoRegulation(e.target.checked)
                      }
                      disabled={cellarLoading}
                    />
                    Has Auto Regulation
                  </label>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setAddCellarModalOpen(false);
                      setCellarName("");
                      setCellarHeight("");
                      setCellarWidth("");
                      setCellarDepth("");
                      setCellarBottleCapacity("");
                      setCellarType("PRIVATE");
                      setCellarCoolingSystem(false);
                      setCellarHumidityControl(false);
                      setCellarAutoRegulation(false);
                      setCellarError("");
                    }}
                    className="btn-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={cellarLoading}
                    className="btn-create"
                  >
                    {cellarLoading ? "Creating..." : "Create Cellar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Cellar Modal - Only show for customers */}
        {!user?.employeeType && editCellarModalOpen && (
          <div className="modal-overlay" role="dialog" aria-modal>
            <div className="modal">
              <div className="modal-header">
                <h3>Update Cellar</h3>
                <button
                  className="modal-close-light"
                  aria-label="Close"
                  onClick={() => {
                    setEditCellarModalOpen(false);
                    setCellarName("");
                    setCellarHeight("");
                    setCellarWidth("");
                    setCellarDepth("");
                    setCellarBottleCapacity("");
                    setCellarType("PRIVATE");
                    setCellarCoolingSystem(false);
                    setCellarHumidityControl(false);
                    setCellarAutoRegulation(false);
                    setEditingCellarId(null);
                    setCellarError("");
                  }}
                >
                  &#10005;
                </button>
              </div>

              {cellarError && (
                <div className="alert alert-error">{cellarError}</div>
              )}

              <form onSubmit={handleCellarUpdate} className="create-job-form">
                <div className="form-group">
                  <label htmlFor="editCellarName">Cellar Name *</label>
                  <input
                    id="editCellarName"
                    type="text"
                    value={cellarName}
                    onChange={(e) => setCellarName(e.target.value)}
                    placeholder="e.g., Main Wine Cellar"
                    disabled={cellarLoading}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="editCellarHeight">Height (cm) *</label>
                    <input
                      id="editCellarHeight"
                      type="number"
                      step="0.1"
                      value={cellarHeight}
                      onChange={(e) => setCellarHeight(e.target.value)}
                      placeholder="200"
                      disabled={cellarLoading}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="editCellarWidth">Width (cm) *</label>
                    <input
                      id="editCellarWidth"
                      type="number"
                      step="0.1"
                      value={cellarWidth}
                      onChange={(e) => setCellarWidth(e.target.value)}
                      placeholder="300"
                      disabled={cellarLoading}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="editCellarDepth">Depth (cm) *</label>
                    <input
                      id="editCellarDepth"
                      type="number"
                      step="0.1"
                      value={cellarDepth}
                      onChange={(e) => setCellarDepth(e.target.value)}
                      placeholder="250"
                      disabled={cellarLoading}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="editCellarBottleCapacity">
                      Bottle Capacity *
                    </label>
                    <input
                      id="editCellarBottleCapacity"
                      type="number"
                      value={cellarBottleCapacity}
                      onChange={(e) => setCellarBottleCapacity(e.target.value)}
                      placeholder="500"
                      disabled={cellarLoading}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="editCellarType">Cellar Type</label>
                  <select
                    id="editCellarType"
                    value={cellarType}
                    onChange={(e) => setCellarType(e.target.value)}
                    disabled={cellarLoading}
                  >
                    <option value="PRIVATE">Private</option>
                    <option value="COMMERCIAL">Commercial</option>
                    <option value="PROFESSIONAL">Professional</option>
                    <option value="MODULAR">Modular</option>
                  </select>
                </div>

                <div
                  className="form-group"
                  style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={cellarCoolingSystem}
                      onChange={(e) => setCellarCoolingSystem(e.target.checked)}
                      disabled={cellarLoading}
                    />
                    Has Cooling System
                  </label>

                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={cellarHumidityControl}
                      onChange={(e) =>
                        setCellarHumidityControl(e.target.checked)
                      }
                      disabled={cellarLoading}
                    />
                    Has Humidity Control
                  </label>

                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={cellarAutoRegulation}
                      onChange={(e) =>
                        setCellarAutoRegulation(e.target.checked)
                      }
                      disabled={cellarLoading}
                    />
                    Has Auto Regulation
                  </label>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setEditCellarModalOpen(false);
                      setCellarName("");
                      setCellarHeight("");
                      setCellarWidth("");
                      setCellarDepth("");
                      setCellarBottleCapacity("");
                      setCellarType("PRIVATE");
                      setCellarCoolingSystem(false);
                      setCellarHumidityControl(false);
                      setCellarAutoRegulation(false);
                      setEditingCellarId(null);
                      setCellarError("");
                    }}
                    className="btn-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={cellarLoading}
                    className="btn-create"
                  >
                    {cellarLoading ? "Updating..." : "Update Cellar"}
                  </button>
                </div>
              </form>
            </div>
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
                <div className="alert alert-error">{formError || error}</div>
              )}

              <div className="form-actions">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary"
                >
                  {isLoading ? "Updating..." : "Update Password"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPasswordMode(false);
                    setOldPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setFormError("");
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
            ) : (
              <div className="modal-content-light">
                <div className="modal-section schedule-calendar-section">
                  <h4 className="modal-label">Select Date</h4>
                  <div className="calendar-center">
                    <Calendar
                      onChange={(date) => setSelectedDate(date as Date | null)}
                      value={selectedDate}
                    />
                  </div>
                </div>
                <div className="modal-section">
                  <h4 className="modal-label">Time Slots</h4>
                  <ul className="modal-list">
                    {(() => {
                      if (!selectedDate)
                        return (
                          <li className="modal-list-item">Select a date</li>
                        );
                      const sched =
                        selectedDateSchedule as EmployeeSchedule | null;
                      if (
                        !sched ||
                        !sched.timeSlots ||
                        sched.timeSlots.length === 0
                      ) {
                        const dayOfWeek = selectedDate
                          .toLocaleDateString("en-US", { weekday: "long" })
                          .toUpperCase();
                        const weekly = (schedule || []).find(
                          (s: Record<string, unknown>) =>
                            ((s.dayOfWeek as string) || "")?.toUpperCase() ===
                            dayOfWeek
                        ) as EmployeeSchedule | undefined;
                        if (
                          weekly &&
                          Array.isArray(weekly.timeSlots) &&
                          weekly.timeSlots.length > 0
                        ) {
                          return weekly.timeSlots.map(
                            (slot: string, i: number) => (
                              <li key={i} className="modal-list-item">
                                {slot}
                              </li>
                            )
                          );
                        }
                        return (
                          <li className="modal-list-item">
                            No schedule for this date
                          </li>
                        );
                      }
                      return (sched.timeSlots || []).map(
                        (slot: string, i: number) => (
                          <li key={i} className="modal-list-item">
                            {slot}
                          </li>
                        )
                      );
                    })()}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
