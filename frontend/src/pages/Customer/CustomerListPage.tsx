import React, { useEffect, useState } from "react";
import { getCustomers } from "../../features/customer/api/getAllCustomers";
import { getCustomer } from "../../features/customer/api/getCustomerById";
import { createCustomer } from "../../features/customer/api/createCustomer";

import type { CustomerRequestModel } from "../../features/customer/models/CustomerRequestModel";
import type { PhoneType } from "../../features/customer/models/CustomerPhoneNumber";
import type { CustomerResponseModel } from "../../features/customer/models/CustomerResponseModel";

import "./CustomerListPage.css";

export default function CustomerListPage(): React.ReactElement {
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

  function closeDetails() {
    setModalOpen(false);
    setSelectedCustomer(null);
  }

  /* ---------------------------------------------
     CREATE CUSTOMER HANDLER
  --------------------------------------------- */
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);

    const req: CustomerRequestModel = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phoneNumbers: phoneNumber
        ? [{ type: phoneType, number: phoneNumber }]
        : [],
      streetAddress: streetAddress.trim(),
      city: city.trim(),
      province: province.trim(),
      country: country.trim(),
      postalCode: postalCode.trim(),
      userId: userId.trim(),
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

  return (
    <div className="customers-page-light">
      <h2 className="customers-title-light">Customers</h2>

      <button className="btn-view-light" onClick={() => setCreateModalOpen(true)}>
        Add Customer
      </button>

      <div className="customers-card-light">
        {loading ? (
          <div className="loading-light">Loading...</div>
        ) : (
          <table className="customers-table-light">
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.customerId}>
                  <td>{c.customerId}</td>
                  <td>
                    <button
                      className="btn-view-light"
                      onClick={() => openDetails(c.customerId)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ============================
          DETAILS MODAL
      ================================ */}
      {modalOpen && (
        <div className="modal-overlay-light">
          <div className="modal-container-light">
            <div className="modal-header-light">
              <h3>Customer Details</h3>
              <button className="modal-close-light" onClick={closeDetails}>✕</button>
            </div>

            {detailLoading ? (
              <div className="loading-light">Loading details...</div>
            ) : (
              selectedCustomer && (
                <div className="modal-content-light">
                  <div className="modal-section">
                    <h4 className="modal-label">Customer ID</h4>
                    <p className="modal-value">{selectedCustomer.customerId}</p>
                  </div>

                  <div className="modal-section">
                    <h4 className="modal-label">Name</h4>
                    <p className="modal-value">
                      {selectedCustomer.firstName} {selectedCustomer.lastName}
                    </p>
                  </div>

                  <div className="modal-section">
                    <h4 className="modal-label">Phone Numbers</h4>
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
                    <h4 className="modal-label">Address</h4>
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
                    <h4 className="modal-label">User ID</h4>
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
                ✕
              </button>
            </div>

            <div className="modal-content-light">

              {createError && <div className="error-message">{createError}</div>}

              <form className="create-customer-form" onSubmit={handleCreate}>

                <h4 className="form-section-title">Personal Details</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>First Name</label>
                    <input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <h4 className="form-section-title">Contact Information</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Phone Type</label>
                    <select
                      value={phoneType}
                      onChange={(e) => setPhoneType(e.target.value as PhoneType)}
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
                  <label>Street Address</label>
                  <input
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>City</label>
                    <input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Province</label>
                    <input
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Country</label>
                    <input
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Postal Code</label>
                    <input
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>User ID</label>
                  <input
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                  />
                </div>

                <div className="form-actions">
                  <button className="btn-create" type="submit" disabled={createLoading}>
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
    </div>
  );
}
