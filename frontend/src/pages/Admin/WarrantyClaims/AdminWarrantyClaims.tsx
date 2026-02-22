import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getAllWarrantyClaims,
  updateWarrantyClaimStatus,
} from '../../../features/warranty/api/warrantyClaimApi';
import type { WarrantyClaimResponseModel } from '../../../features/warranty/models/WarrantyModels';
import { sanitizeInput } from '../../../utils/sanitizer';
import { trimToMaxWords } from '../../../utils/wordLimit';
import { formatDateLocalized } from '../../../utils/localeFormat';
import './AdminWarrantyClaims.css';

export default function AdminWarrantyClaims() {
  const { t, i18n } = useTranslation();
  const ADMIN_NOTES_MAX_WORDS = 120;
  const RESOLUTION_DETAILS_MAX_WORDS = 120;
  const [claims, setClaims] = useState<WarrantyClaimResponseModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<WarrantyClaimResponseModel | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [updateData, setUpdateData] = useState({
    status: '',
    adminNotes: '',
    resolutionDetails: '',
  });

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    try {
      const data = await getAllWarrantyClaims();
      setClaims(data);
    } catch (error) {
      console.error('Error fetching warranty claims:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewClaim = (claim: WarrantyClaimResponseModel) => {
    setSelectedClaim(claim);
    setUpdateData({
      status: claim.status,
      adminNotes: claim.adminNotes || '',
      resolutionDetails: claim.resolutionDetails || '',
    });
    setShowModal(true);
  };

  const handleUpdateClaim = async () => {
    if (!selectedClaim) return;

    try {
      await updateWarrantyClaimStatus(selectedClaim.claimId, updateData);
      await fetchClaims();
      setShowModal(false);
      setSelectedClaim(null);
    } catch (error) {
      console.error('Error updating warranty claim:', error);
      alert('Failed to update claim. Please try again.');
    }
  };

  const handleContactCustomer = (claim: WarrantyClaimResponseModel) => {
    if (claim.preferredContactMethod === 'EMAIL') {
      window.location.href = `mailto:${claim.customerEmail}?subject=Warranty Claim ${claim.claimId}`;
    } else {
      window.location.href = `tel:${claim.customerPhone}`;
    }
  };

  const getStatusStyles = (status: string) => {
    const styles: Record<string, { backgroundColor: string; color: string }> = {
      PENDING: { backgroundColor: '#7a2e00', color: '#ffffff' },
      IN_REVIEW: { backgroundColor: '#0c4a6e', color: '#ffffff' },
      APPROVED: { backgroundColor: '#0b3d2f', color: '#ffffff' },
      REJECTED: { backgroundColor: '#7a1f24', color: '#ffffff' },
      RESOLVED: { backgroundColor: '#4f4440', color: '#ffffff' },
    };
    return styles[status] || { backgroundColor: '#4f4440', color: '#ffffff' };
  };

  const filteredClaims =
    filterStatus === 'ALL' ? claims : claims.filter((claim) => claim.status === filterStatus);

  if (loading) {
    return (
      <div className="admin-warranty-container">
        <div className="loading-spinner">Loading warranty claims...</div>
      </div>
    );
  }

  return (
    <div className="admin-warranty-container">
      <div className="admin-warranty-header">
        <h1>{t('pages.adminWarranty.title')}</h1>
        <div className="warranty-stats">
          <div className="stat-card">
            <span className="stat-number">{claims.length}</span>
            <span className="stat-label">{t('pages.adminWarranty.totalClaims')}</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">
              {claims.filter((c) => c.status === 'PENDING').length}
            </span>
            <span className="stat-label">{t('pages.adminWarranty.pending')}</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">
              {claims.filter((c) => c.status === 'IN_REVIEW').length}
            </span>
            <span className="stat-label">{t('pages.adminWarranty.inReview')}</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">
              {claims.filter((c) => c.status === 'RESOLVED').length}
            </span>
            <span className="stat-label">{t('pages.adminWarranty.resolved')}</span>
          </div>
        </div>
      </div>

      <div className="warranty-filters">
        <label>{t('pages.adminWarranty.filterByStatus')}</label>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="ALL">{t('pages.adminWarranty.allStatuses')}</option>
          <option value="PENDING">{t('pages.adminWarranty.pending')}</option>
          <option value="IN_REVIEW">{t('pages.adminWarranty.inReview')}</option>
          <option value="APPROVED">{t('pages.adminWarranty.approved')}</option>
          <option value="REJECTED">{t('pages.adminWarranty.rejected')}</option>
          <option value="RESOLVED">{t('pages.adminWarranty.resolved')}</option>
        </select>
      </div>

      <div className="warranty-claims-table">
        <table>
          <thead>
            <tr>
              <th>{t('pages.adminWarranty.claimId')}</th>
              <th>{t('pages.adminWarranty.customer')}</th>
              <th>{t('pages.adminWarranty.product')}</th>
              <th>{t('pages.adminWarranty.purchaseDate')}</th>
              <th>{t('pages.adminWarranty.status')}</th>
              <th>{t('pages.adminWarranty.createdAt')}</th>
              <th>{t('pages.adminWarranty.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredClaims.length === 0 ? (
              <tr>
                <td colSpan={7} className="no-claims">
                  {t('pages.adminWarranty.noClaims')}
                </td>
              </tr>
            ) : (
              filteredClaims.map((claim) => (
                <tr key={claim.claimId}>
                  <td className="claim-id">{claim.claimId.substring(0, 8)}</td>
                  <td>
                    <div className="customer-info">
                      <div className="customer-name">{claim.customerName}</div>
                      <div className="customer-email">{claim.customerEmail}</div>
                    </div>
                  </td>
                  <td>{claim.productName}</td>
                  <td>{formatDateLocalized(claim.purchaseDate, i18n.language)}</td>
                  <td>
                    <span className="warranty-status-badge" style={getStatusStyles(claim.status)}>
                      {claim.status}
                    </span>
                  </td>
                  <td>{formatDateLocalized(claim.createdAt, i18n.language)}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-view" onClick={() => handleViewClaim(claim)}>
                        {t('pages.adminWarranty.view')}
                      </button>
                      <button className="btn-contact" onClick={() => handleContactCustomer(claim)}>
                        {t('pages.adminWarranty.contact')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && selectedClaim && (
        <div className="admin-warranty-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-warranty-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="admin-warranty-modal-header">
              <h2>{t('pages.adminWarranty.claimDetails')}</h2>
              <button className="admin-warranty-modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

            <div className="admin-warranty-modal-body">
              <div className="claim-details-grid">
                <div className="detail-section">
                  <h3>{t('pages.adminWarranty.customerInformation')}</h3>
                  <div className="detail-item">
                    <strong>{t('pages.adminWarranty.name')}:</strong> {selectedClaim.customerName}
                  </div>
                  <div className="detail-item">
                    <strong>{t('pages.adminWarranty.email')}:</strong> {selectedClaim.customerEmail}
                  </div>
                  <div className="detail-item">
                    <strong>{t('pages.adminWarranty.phone')}:</strong> {selectedClaim.customerPhone}
                  </div>
                  {selectedClaim.customerAddress && (
                    <div className="detail-item">
                      <strong>{t('pages.adminWarranty.address')}:</strong>{' '}
                      {selectedClaim.customerAddress}
                    </div>
                  )}
                  <div className="detail-item">
                    <strong>{t('pages.adminWarranty.preferredContact')}:</strong>{' '}
                    {selectedClaim.preferredContactMethod}
                  </div>
                </div>

                <div className="detail-section">
                  <h3>{t('pages.adminWarranty.productInformation')}</h3>
                  <div className="detail-item">
                    <strong>{t('pages.adminWarranty.product')}:</strong> {selectedClaim.productName}
                  </div>
                  {selectedClaim.productSerialNumber && (
                    <div className="detail-item">
                      <strong>{t('pages.adminWarranty.serialNumber')}:</strong>{' '}
                      {selectedClaim.productSerialNumber}
                    </div>
                  )}
                  <div className="detail-item">
                    <strong>{t('pages.adminWarranty.purchaseDate')}:</strong>{' '}
                    {formatDateLocalized(selectedClaim.purchaseDate, i18n.language)}
                  </div>
                </div>
              </div>

              <div className="detail-section full-width">
                <h3>{t('pages.adminWarranty.issueDescription')}</h3>
                <p className="issue-description">{selectedClaim.issueDescription}</p>
              </div>

              <div className="detail-section full-width">
                <h3>{t('pages.adminWarranty.updateClaim')}</h3>

                <div className="admin-warranty-form-group">
                  <label>{t('pages.adminWarranty.status')}</label>
                  <select
                    value={updateData.status}
                    onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })}
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="IN_REVIEW">IN_REVIEW</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="REJECTED">REJECTED</option>
                    <option value="RESOLVED">RESOLVED</option>
                  </select>
                </div>

                <div className="admin-warranty-form-group">
                  <label>{t('pages.adminWarranty.adminNotes')}</label>
                  <textarea
                    value={updateData.adminNotes}
                    onChange={(e) =>
                      setUpdateData({
                        ...updateData,
                        adminNotes: trimToMaxWords(
                          sanitizeInput(e.target.value),
                          ADMIN_NOTES_MAX_WORDS
                        ),
                      })
                    }
                    rows={4}
                    placeholder={t('pages.adminWarranty.adminNotesPlaceholder')}
                  />
                </div>

                <div className="admin-warranty-form-group">
                  <label>{t('pages.adminWarranty.resolutionDetails')}</label>
                  <textarea
                    value={updateData.resolutionDetails}
                    onChange={(e) =>
                      setUpdateData({
                        ...updateData,
                        resolutionDetails: trimToMaxWords(
                          sanitizeInput(e.target.value),
                          RESOLUTION_DETAILS_MAX_WORDS
                        ),
                      })
                    }
                    rows={4}
                    placeholder={t('pages.adminWarranty.resolutionDetailsPlaceholder')}
                  />
                </div>
              </div>
            </div>

            <div className="admin-warranty-modal-footer">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>
                {t('pages.adminWarranty.cancel')}
              </button>
              <button className="btn-save" onClick={handleUpdateClaim}>
                {t('pages.adminWarranty.saveChanges')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
