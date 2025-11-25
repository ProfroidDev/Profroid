import React, { useEffect, useState } from "react";
import { getCustomers } from "../../features/customer/api/getAllCustomers";
import { getCustomer } from "../../features/customer/api/getCustomerById";
import type { CustomerResponseModel } from "../../features/customer/models/CustomerResponseModel";

import "./CustomerListPage.css";

export default function CustomerListPage(): React.ReactElement {
  const [customers, setCustomers] = useState<CustomerResponseModel[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerResponseModel | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);

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

  function closeModal() {
    setModalOpen(false);
    setSelectedCustomer(null);
  }

  return (
    <div className="customers-page-light">
      <h2 className="customers-title-light">Customers</h2>

      <div className="customers-card-light">
        {loading ? (
          <div className="loading-light">Loading customers...</div>
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

      {modalOpen && (
        <div className="modal-overlay-light">
          <div className="modal-container-light">
            <div className="modal-header-light">
              <h3>Customer Details</h3>
              <button className="modal-close-light" onClick={closeModal}>
                ✕
              </button>
            </div>

            {detailLoading && (
              <div className="loading-light">Loading details...</div>
            )}

            {!detailLoading && selectedCustomer && (
              <div className="modal-content-light">
                {/* Section: Identity */}
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

                {/* Section: Phones */}
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

                {/* Section: Address */}
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
                  <h4 className="modal-label">UserId</h4>
                  <p className="modal-value">
                    {selectedCustomer.userId}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
