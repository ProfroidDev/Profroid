import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../features/authentication/store/authStore';
import { getCustomers } from '../../features/customer/api/getAllCustomers';
import { getCustomer } from '../../features/customer/api/getCustomerById';
import { deleteCustomer } from '../../features/customer/api/deleteCustomer';
import ConfirmationModal from '../../components/ConfirmationModal';

import type { CustomerResponseModel } from '../../features/customer/models/CustomerResponseModel';

import './CustomerListPage.css';

export default function CustomerListPage(): React.ReactElement {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const isAdmin = user?.employeeType === 'ADMIN';
  const [customers, setCustomers] = useState<CustomerResponseModel[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState<CustomerResponseModel | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  // Delete confirmation
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CustomerResponseModel | null>(null);
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

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;

    setDeleteLoading(true);
    setDeleteError(null);

    try {
      await deleteCustomer(deleteTarget.customerId);
      setCustomers((prev) => prev.filter((c) => c.customerId !== deleteTarget.customerId));

      if (selectedCustomer?.customerId === deleteTarget.customerId) {
        setSelectedCustomer(null);
        setModalOpen(false);
      }

      closeDelete();
    } catch {
      setDeleteError(t('messages.failedToDeleteCustomer'));
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="customers-page-light">
      <h2 className="customers-title-light">{t('pages.customers.title')}</h2>

      <div className="customers-card-light">
        {loading ? (
          <div className="loading-light">{t('common.loading')}</div>
        ) : (
          <table className="customers-table-light">
            <thead>
              <tr>
                <th>{t('pages.customers.name')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.customerId}>
                  <td>
                    {c.firstName} {c.lastName}
                  </td>
                  <td>
                    <button className="btn-view-light" onClick={() => openDetails(c.customerId)}>
                      {t('pages.customers.viewDetails')}
                    </button>
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
        message={deleteError ?? `${t('messages.confirmDelete')}`}
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
                      {selectedCustomer.province && `, ${selectedCustomer.province}`}
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
    </div>
  );
}
