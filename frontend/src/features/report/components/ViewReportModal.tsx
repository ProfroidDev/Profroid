import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, User, Briefcase, Calendar, Clock, DollarSign, Package } from 'lucide-react';
import type { ReportResponseModel } from '../models/ReportResponseModel';
import './ViewReportModal.css';

interface ViewReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: ReportResponseModel;
}

export default function ViewReportModal({
  isOpen,
  onClose,
  report,
}: ViewReportModalProps): React.ReactElement | null {
  const { i18n } = useTranslation();
  
  // Language detection helper
  const isFrench = i18n.language === 'fr';

  // Helper function to get localized job name
  const getJobName = (): string => {
    if (isFrench && report.jobNameFr) {
      return report.jobNameFr;
    }
    return report.jobName;
  };

  if (!isOpen) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(isFrench ? 'fr-FR' : 'en-CA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="report-modal-overlay" onClick={onClose}>
      <div className="report-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="report-modal-header">
          <h2>{isFrench ? 'Détails du Rapport de Travail' : 'Work Report Details'}</h2>
          <button className="close-button" onClick={onClose} aria-label="Close">
            <X size={24} />
          </button>
        </div>

        <div className="report-modal-body">
          {/* Customer Info Section */}
          <div className="report-section">
            <h3 className="section-title">{isFrench ? 'Informations du Client' : 'Customer Information'}</h3>
            <div className="info-grid">
              <div className="info-item">
                <User size={18} />
                <div>
                  <span className="info-label">{isFrench ? 'Client' : 'Customer'}</span>
                  <span className="info-value">
                    {report.customerFirstName} {report.customerLastName}
                  </span>
                </div>
              </div>
              <div className="info-item">
                <Briefcase size={18} />
                <div>
                  <span className="info-label">{isFrench ? 'Service' : 'Service'}</span>
                  <span className="info-value">{getJobName()}</span>
                </div>
              </div>
              <div className="info-item">
                <Calendar size={18} />
                <div>
                  <span className="info-label">{isFrench ? 'Date' : 'Date'}</span>
                  <span className="info-value">{formatDate(report.appointmentDate)}</span>
                </div>
              </div>
              <div className="info-item">
                <DollarSign size={18} />
                <div>
                  <span className="info-label">{isFrench ? 'Taux Horaire' : 'Hourly Rate'}</span>
                  <span className="info-value">{formatCurrency(report.hourlyRate)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Work Details Section */}
          <div className="report-section">
            <h3 className="section-title">{isFrench ? 'Détails du Travail' : 'Work Details'}</h3>
            <div className="info-grid">
              <div className="info-item">
                <Clock size={18} />
                <div>
                  <span className="info-label">{isFrench ? 'Heures Travaillées' : 'Hours Worked'}</span>
                  <span className="info-value">{report.hoursWorked} {isFrench ? 'heures' : 'hours'}</span>
                </div>
              </div>
              <div className="info-item">
                <DollarSign size={18} />
                <div>
                  <span className="info-label">{isFrench ? 'Coût de la Main-d\'œuvre' : 'Labor Cost'}</span>
                  <span className="info-value">{formatCurrency(report.laborCost)}</span>
                </div>
              </div>
              <div className="info-item">
                <DollarSign size={18} />
                <div>
                  <span className="info-label">{isFrench ? 'Autres Frais' : 'Other Costs'}</span>
                  <span className="info-value">{formatCurrency(report.frais)}</span>
                </div>
              </div>
              <div className="info-item">
                <DollarSign size={18} />
                <div>
                  <span className="info-label">{isFrench ? 'Frais de Déplacement' : 'Travel Expenses'}</span>
                  <span className="info-value">{formatCurrency(report.fraisDeplacement)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Parts Section */}
          {report.parts && report.parts.length > 0 && (
            <div className="report-section">
              <h3 className="section-title">
                <Package size={20} />
                {isFrench ? 'Pièces Utilisées' : 'Parts Used'}
              </h3>
              <div className="parts-list">
                {report.parts.map((part) => (
                  <div key={part.partId} className="part-item-view">
                    <div className="part-header">
                      <span className="part-name">{part.partName}</span>
                      <span className="part-price">{formatCurrency(part.price)}</span>
                    </div>
                    <div className="part-details">
                      <span className="part-quantity">{isFrench ? 'Qtité:' : 'Quantity:'} {part.quantity}</span>
                      <span className="part-total">
                        {isFrench ? 'Total:' : 'Total:'} {formatCurrency(part.price * part.quantity)}
                      </span>
                    </div>
                    {part.notes && (
                      <div className="part-notes">
                        <span className="notes-label">{isFrench ? 'Notes:' : 'Notes:'}</span>
                        <span className="notes-text">{part.notes}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="parts-total">
                <span>{isFrench ? 'Coût Total des Pièces:' : 'Total Parts Cost:'}</span>
                <span className="parts-total-value">{formatCurrency(report.partsCost)}</span>
              </div>
            </div>
          )}

          {/* Totals Section */}
          <div className="report-section totals-section">
            <h3 className="section-title">{isFrench ? 'Résumé' : 'Summary'}</h3>
            <div className="totals-grid">
              <div className="total-row">
                <span>{isFrench ? 'Sous-total' : 'Subtotal'}</span>
                <span>{formatCurrency(report.subtotal)}</span>
              </div>
              <div className="total-row">
                <span>TPS (5%)</span>
                <span>{formatCurrency(report.tpsAmount)}</span>
              </div>
              <div className="total-row">
                <span>TVQ (9.975%)</span>
                <span>{formatCurrency(report.tvqAmount)}</span>
              </div>
              <div className="total-row grand-total">
                <span>{isFrench ? 'Total' : 'Grand Total'}</span>
                <span>{formatCurrency(report.total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="report-modal-footer">
          <button className="btn-close" onClick={onClose}>
            {isFrench ? 'Fermer' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
