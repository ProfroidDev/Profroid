import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import useAuthStore from "../../features/authentication/store/authStore";
import { getCustomers } from "../../features/customer/api/getAllCustomers";
import { getCustomer } from "../../features/customer/api/getCustomerById";
import { createCustomer } from "../../features/customer/api/createCustomer";
import { updateCustomer } from "../../features/customer/api/updateCustomer";
import { deleteCustomer } from "../../features/customer/api/deleteCustomer";
import ConfirmationModal from "../../components/ConfirmationModal";

import type { CustomerRequestModel } from "../../features/customer/models/CustomerRequestModel";
import type { PhoneType } from "../../features/customer/models/CustomerPhoneNumber";
import type { CustomerResponseModel } from "../../features/customer/models/CustomerResponseModel";

import "./CustomerListPage.css";

export default function CustomerListPage(): React.ReactElement {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const isAdmin = user?.employeeType === "ADMIN";
  const [customers, setCustomers] = useState<CustomerResponseModel[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerResponseModel | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Create form
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneType, setPhoneType] = useState<PhoneType>("MOBILE");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [country, setCountry] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [userId, setUserId] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit form
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editPhoneType, setEditPhoneType] = useState<PhoneType>("MOBILE");
  const [editPhoneNumber, setEditPhoneNumber] = useState("");
  const [editStreetAddress, setEditStreetAddress] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editProvince, setEditProvince] = useState("");
  const [editCountry, setEditCountry] = useState("");
  const [editPostalCode, setEditPostalCode] = useState("");
  const [editUserId, setEditUserId] = useState("");

  // Delete confirmation
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] =
    useState<CustomerResponseModel | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getCustomers();
        setCustomers(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function openDetails(customerId: string) {
    setModalOpen(true);
    setDetailLoading(true);
    try {
      const data = await getCustomer(customerId);
      setSelectedCustomer(data);
    } finally {
      setDetailLoading(false);
    }
  }

  async function openEditFromList(customerId: string) {
    setEditError(null);
    setDetailLoading(true);
    try {
      const data = await getCustomer(customerId);
      setSelectedCustomer(data);

      setEditFirstName(data.firstName ?? "");
      setEditLastName(data.lastName ?? "");
      setEditPhoneType(data.phoneNumbers?.[0]?.type ?? "MOBILE");
      setEditPhoneNumber(data.phoneNumbers?.[0]?.number ?? "");
      setEditStreetAddress(data.streetAddress ?? "");
      setEditCity(data.city ?? "");
      setEditProvince(data.province ?? "");
      setEditCountry(data.country ?? "");
      setEditPostalCode(data.postalCode ?? "");
      setEditUserId(data.userId ?? "");

      setEditModalOpen(true);
    } finally {
      setDetailLoading(false);
    }
  }

  function closeDetails() {
    setModalOpen(false);
    setSelectedCustomer(null);
  }

  function openDelete(customer: CustomerResponseModel) {
    setDeleteTarget(customer);
    setDeleteError(null);
    setDeleteModalOpen(true);
  }

  function closeDelete() {
    setDeleteModalOpen(false);
    setDeleteTarget(null);
    setDeleteError(null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);

    // Validate required fields - check for empty strings after trim
    const firstNameTrimmed = firstName.trim();
    const lastNameTrimmed = lastName.trim();
    const streetAddressTrimmed = streetAddress.trim();
    const cityTrimmed = city.trim();
    const provinceTrimmed = province.trim();
    const countryTrimmed = country.trim();
    const postalCodeTrimmed = postalCode.trim();
    const userIdTrimmed = userId.trim();

    if (!firstNameTrimmed || firstNameTrimmed.length === 0) {
      setCreateError("First name is required and cannot be empty");
      return;
    }
    if (!lastNameTrimmed || lastNameTrimmed.length === 0) {
      setCreateError("Last name is required and cannot be empty");
      return;
    }
    if (!streetAddressTrimmed || streetAddressTrimmed.length === 0) {
      setCreateError("Street address is required and cannot be empty");
      return;
    }
    if (!cityTrimmed || cityTrimmed.length === 0) {
      setCreateError("City is required and cannot be empty");
      return;
    }
    if (!provinceTrimmed || provinceTrimmed.length === 0) {
      setCreateError("Province is required and cannot be empty");
      return;
    }
    if (!countryTrimmed || countryTrimmed.length === 0) {
      setCreateError("Country is required and cannot be empty");
      return;
    }
    if (!postalCodeTrimmed || postalCodeTrimmed.length === 0) {
      setCreateError("Postal code is required and cannot be empty");
      return;
    }
    if (!userIdTrimmed || userIdTrimmed.length === 0) {
      setCreateError("User ID is required and cannot be empty");
      return;
    }

    setCreateLoading(true);

    const req: CustomerRequestModel = {
      firstName: firstNameTrimmed,
      lastName: lastNameTrimmed,
      phoneNumbers: phoneNumber.trim()
        ? [{ type: phoneType, number: phoneNumber.trim() }]
        : [],
      streetAddress: streetAddressTrimmed,
      city: cityTrimmed,
      province: provinceTrimmed,
      country: countryTrimmed,
      postalCode: postalCodeTrimmed,
      userId: userIdTrimmed,
    };

    try {
      const created = await createCustomer(req);
      setCustomers((prev) => [created, ...prev]);

      // reset
      setFirstName("");
      setLastName("");
      setPhoneType("MOBILE");
      setPhoneNumber("");
      setStreetAddress("");
      setCity("");
      setProvince("");
      setCountry("");
      setPostalCode("");
      setUserId("");

      setCreateModalOpen(false);
    } catch {
      setCreateError("Failed to create customer. Try again.");
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCustomer) return;

    // Validate required fields - check for empty strings after trim
    const firstNameTrimmed = editFirstName.trim();
    const lastNameTrimmed = editLastName.trim();
    const streetAddressTrimmed = editStreetAddress.trim();
    const cityTrimmed = editCity.trim();
    const provinceTrimmed = editProvince.trim();
    const countryTrimmed = editCountry.trim();
    const postalCodeTrimmed = editPostalCode.trim();
    const userIdTrimmed = editUserId.trim();

    // Validation checks with immediate error reporting
    const validationChecks = [
      { value: firstNameTrimmed, field: "First name" },
      { value: lastNameTrimmed, field: "Last name" },
      { value: streetAddressTrimmed, field: "Street address" },
      { value: cityTrimmed, field: "City" },
      { value: provinceTrimmed, field: "Province" },
      { value: countryTrimmed, field: "Country" },
      { value: postalCodeTrimmed, field: "Postal code" },
      { value: userIdTrimmed, field: "User ID" },
    ];

    const firstEmptyField = validationChecks.find(
      (check) => !check.value || check.value.length === 0
    );

    if (firstEmptyField) {
      setEditError(`${firstEmptyField.field} is required and cannot be empty`);
      console.error(`Validation failed: ${firstEmptyField.field} is empty`, {
        firstNameTrimmed,
        lastNameTrimmed,
        streetAddressTrimmed,
        cityTrimmed,
        provinceTrimmed,
        countryTrimmed,
        postalCodeTrimmed,
        userIdTrimmed,
      });
      return;
    }

    // All validation passed
    setEditLoading(true);
    setEditError(null);

    const req: CustomerRequestModel = {
      firstName: firstNameTrimmed,
      lastName: lastNameTrimmed,
      phoneNumbers: editPhoneNumber.trim()
        ? [{ type: editPhoneType, number: editPhoneNumber.trim() }]
        : [],
      streetAddress: streetAddressTrimmed,
      city: cityTrimmed,
      province: provinceTrimmed,
      country: countryTrimmed,
      postalCode: postalCodeTrimmed,
      userId: userIdTrimmed,
    };

    console.log("Submitting customer update with validated data:", req);

    try {
      const updated = await updateCustomer(selectedCustomer.customerId, req);

      setCustomers((prev) =>
        prev.map((c) => (c.customerId === updated.customerId ? updated : c))
      );
      setSelectedCustomer(updated);
      setEditModalOpen(false);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setEditError("Failed to update customer. Try again.");
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;

    setDeleteLoading(true);
    setDeleteError(null);

    try {
      await deleteCustomer(deleteTarget.customerId);
      setCustomers((prev) =>
        prev.filter((c) => c.customerId !== deleteTarget.customerId)
      );

      if (selectedCustomer?.customerId === deleteTarget.customerId) {
        setSelectedCustomer(null);
        setModalOpen(false);
        setEditModalOpen(false);
      }

      closeDelete();
    } catch {
      setDeleteError("Failed to delete customer. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="customers-page-light">
      <h2 className="customers-title-light">{t('pages.customers.title')}</h2>

      {!isAdmin && (
        <button
          className="btn-view-light"
          onClick={() => setCreateModalOpen(true)}
        >
          {t('pages.customers.addCustomer')}
        </button>
      )}

      <div className="customers-card-light">
        {loading ? (
          <div className="loading-light">{t('common.loading')}</div>
        ) : (
          <table className="customers-table-light">
            <thead>
              <tr>
                <th>{t('pages.customers.name')}</th>
                <th>{t('common.edit')}</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.customerId}>
                  <td>
                    {c.firstName} {c.lastName}
                  </td>
                  <td>
                    <button
                      className="btn-view-light"
                      onClick={() => openDetails(c.customerId)}
                    >
                      {t('pages.customers.viewDetails')}
                    </button>
                    {!isAdmin && (
                      <button
                        className="btn-view-light"
                        onClick={() => openEditFromList(c.customerId)}
                        style={{ marginLeft: 8 }}
                      >
                        {t('common.edit')}
                      </button>
                    )}
                    {!isAdmin && (
                      <button
                        className="btn-view-light"
                        onClick={() => openDelete(c)}
                        style={{ marginLeft: 8 }}
                      >
                        {t('common.delete')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmationModal
        isOpen={deleteModalOpen}
        title={t('pages.customers.deleteCustomer')}
        message={
          deleteError ??
          `${t('messages.confirmDelete')}`
        }
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        isDanger
        isLoading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={closeDelete}
      />

      {/* ============================
          DETAILS MODAL
      ================================ */}
      {modalOpen && (
        <div className="modal-overlay-light">
          <div className="modal-container-light">
            <div className="modal-header-light">
              <h3>{t('pages.customers.customerDetails')}</h3>
              <button className="modal-close-light" onClick={closeDetails}>
                &#10005;
              </button>
            </div>

            {detailLoading ? (
              <div className="loading-light">{t('common.loading')}</div>
            ) : (
              selectedCustomer && (
                <div className="modal-content-light">
                  <div className="modal-section">
                    <h4 className="modal-label">{t('pages.customers.customerId')}</h4>
                    <p className="modal-value">{selectedCustomer.customerId}</p>
                  </div>

                  <div className="modal-section">
                    <h4 className="modal-label">{t('pages.customers.name')}</h4>
                    <p className="modal-value">
                      {selectedCustomer.firstName} {selectedCustomer.lastName}
                    </p>
                  </div>

                  <div className="modal-section">
                    <h4 className="modal-label">{t('pages.customers.phoneNumbers')}</h4>
                    <ul className="modal-list">
                      {selectedCustomer.phoneNumbers?.map((p, i) => (
                        <li key={i} className="modal-list-item">
                          <span className="modal-list-type">{p.type}</span>
                          <span>{p.number}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="modal-section">
                    <h4 className="modal-label">{t('pages.customers.address')}</h4>
                    <p className="modal-value">
                      {selectedCustomer.streetAddress}
                      {selectedCustomer.city && `, ${selectedCustomer.city}`}
                      {selectedCustomer.province &&
                        `, ${selectedCustomer.province}`}
                      <br />
                      {selectedCustomer.country} {selectedCustomer.postalCode}
                    </p>
                  </div>

                  <div className="modal-section">
                    <h4 className="modal-label">{t('pages.customers.userId')}</h4>
                    <p className="modal-value">{selectedCustomer.userId}</p>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* ============================
          CREATE CUSTOMER MODAL
      ================================ */}
      {createModalOpen && (
        <div className="modal-overlay-light">
          <div className="modal-container-light">
            <div className="modal-header-light">
              <h3>Create Customer</h3>
              <button
                className="modal-close-light"
                onClick={() => {
                  setCreateModalOpen(false);
                  setCreateError(null);
                }}
              >
                &#10005;
              </button>
            </div>

            <div className="modal-content-light">
              {createError && (
                <div className="error-message">{createError}</div>
              )}

              <form className="create-customer-form" onSubmit={handleCreate}>
                <h4 className="form-section-title">Personal Details</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>First Name *</label>
                    <input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Required"
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name *</label>
                    <input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Required"
                    />
                  </div>
                </div>

                <h4 className="form-section-title">Contact Information</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Phone Type</label>
                    <select
                      value={phoneType}
                      onChange={(e) =>
                        setPhoneType(e.target.value as PhoneType)
                      }
                    >
                      <option value="MOBILE">Mobile</option>
                      <option value="HOME">Home</option>
                      <option value="WORK">Work</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>
                </div>

                <h4 className="form-section-title">Address</h4>

                <div className="form-group">
                  <label>Street Address *</label>
                  <input
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    placeholder="Required"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>City *</label>
                    <input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Required"
                    />
                  </div>

                  <div className="form-group">
                    <label>Province *</label>
                    <input
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      placeholder="Required"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Country *</label>
                    <input
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Required"
                    />
                  </div>

                  <div className="form-group">
                    <label>Postal Code *</label>
                    <input
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="Required"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>User ID *</label>
                  <input
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="Required"
                  />
                </div>

                <div className="form-actions">
                  <button
                    className="btn-create"
                    type="submit"
                    disabled={createLoading}
                  >
                    {createLoading ? "Creating..." : "Create Customer"}
                  </button>
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setCreateModalOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ============================
          EDIT CUSTOMER MODAL
      ================================ */}
      {editModalOpen && (
        <div className="modal-overlay-light">
          <div className="modal-container-light">
            <div className="modal-header-light">
              <h3>Edit Customer</h3>
              <button
                className="modal-close-light"
                onClick={() => {
                  setEditModalOpen(false);
                  setEditError(null);
                }}
              >
                &#10005;
              </button>
            </div>

            <div className="modal-content-light">
              {editError && <div className="error-message">{editError}</div>}

              <form className="create-customer-form" onSubmit={handleUpdate}>
                <h4 className="form-section-title">Personal Details</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>First Name *</label>
                    <input
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                      placeholder="Required"
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name *</label>
                    <input
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      placeholder="Required"
                    />
                  </div>
                </div>

                <h4 className="form-section-title">Contact Information</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Phone Type</label>
                    <select
                      value={editPhoneType}
                      onChange={(e) =>
                        setEditPhoneType(e.target.value as PhoneType)
                      }
                    >
                      <option value="MOBILE">Mobile</option>
                      <option value="HOME">Home</option>
                      <option value="WORK">Work</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      value={editPhoneNumber}
                      onChange={(e) => setEditPhoneNumber(e.target.value)}
                    />
                  </div>
                </div>

                <h4 className="form-section-title">Address</h4>

                <div className="form-group">
                  <label>Street Address *</label>
                  <input
                    value={editStreetAddress}
                    onChange={(e) => setEditStreetAddress(e.target.value)}
                    placeholder="Required"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>City *</label>
                    <input
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      placeholder="Required"
                    />
                  </div>

                  <div className="form-group">
                    <label>Province *</label>
                    <input
                      value={editProvince}
                      onChange={(e) => setEditProvince(e.target.value)}
                      placeholder="Required"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Country *</label>
                    <input
                      value={editCountry}
                      onChange={(e) => setEditCountry(e.target.value)}
                      placeholder="Required"
                    />
                  </div>

                  <div className="form-group">
                    <label>Postal Code *</label>
                    <input
                      value={editPostalCode}
                      onChange={(e) => setEditPostalCode(e.target.value)}
                      placeholder="Required"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>User ID *</label>
                  <input
                    value={editUserId}
                    onChange={(e) => setEditUserId(e.target.value)}
                    placeholder="Required"
                  />
                </div>

                <div className="form-actions">
                  <button
                    className="btn-create"
                    type="submit"
                    disabled={editLoading}
                  >
                    {editLoading ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setEditModalOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
