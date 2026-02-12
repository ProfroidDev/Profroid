import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Plus, Trash2, Search } from 'lucide-react';
import { createReport } from '../api/createReport';
import { updateReport } from '../api/updateReport';
import { getAllParts } from '../../parts/api/getAllParts';
import { sanitizeInput } from '../../../utils/sanitizer';
import type { AppointmentResponseModel } from '../../appointment/models/AppointmentResponseModel';
import type { ReportRequestModel, ReportPartRequestModel } from '../models/ReportRequestModel';
import type { ReportResponseModel } from '../models/ReportResponseModel';
import type { PartResponseModel } from '../../parts/models/PartResponseModel';
import './ReportFormModal.css';

interface ReportFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: AppointmentResponseModel;
  existingReport?: ReportResponseModel | null;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

interface SelectedPart extends ReportPartRequestModel {
  partName: string;
}

export default function ReportFormModal({
  isOpen,
  onClose,
  appointment,
  existingReport,
  onSuccess,
  onError,
}: ReportFormModalProps): React.ReactElement | null {
  const { i18n } = useTranslation();

  // Language detection helper
  const isFrench = i18n.language === 'fr';

  // Helper function to get localized job name
  const getJobName = (): string => {
    if (isFrench && appointment.jobNameFr) {
      return appointment.jobNameFr;
    }
    return appointment.jobName;
  };
  const [loading, setLoading] = useState(false);
  const [hoursWorked, setHoursWorked] = useState('');
  const [frais, setFrais] = useState('');
  const [fraisDeplacement, setFraisDeplacement] = useState('');
  const [selectedParts, setSelectedParts] = useState<SelectedPart[]>([]);

  // Part search
  const [showPartSearch, setShowPartSearch] = useState(false);
  const [partSearchTerm, setPartSearchTerm] = useState('');
  const [availableParts, setAvailableParts] = useState<PartResponseModel[]>([]);
  const [loadingParts, setLoadingParts] = useState(false);

  // Tax constants
  const TPS_RATE = 0.05; // 5%
  const TVQ_RATE = 0.09975; // 9.975%

  const loadParts = async () => {
    try {
      setLoadingParts(true);
      const parts = await getAllParts();
      setAvailableParts(parts.filter((p) => p.available));
    } catch (error) {
      console.error('Error loading parts:', error);
      onError('Failed to load parts inventory');
    } finally {
      setLoadingParts(false);
    }
  };

  // Load existing report data if editing
  useEffect(() => {
    if (existingReport) {
      setHoursWorked(existingReport.hoursWorked.toString());
      setFrais(existingReport.frais.toString());
      setFraisDeplacement(existingReport.fraisDeplacement.toString());
      setSelectedParts(
        existingReport.parts.map((p) => ({
          partId: p.partId,
          partName: p.partName,
          quantity: p.quantity,
          price: p.price,
          notes: p.notes || '',
        }))
      );
    } else {
      // Reset form for new report
      setHoursWorked('');
      setFrais('');
      setFraisDeplacement('');
      setSelectedParts([]);
    }
  }, [existingReport, isOpen]);

  // Load parts when search opens
  useEffect(() => {
    if (showPartSearch && availableParts.length === 0) {
      loadParts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPartSearch]);

  const calculateTotals = () => {
    const hours = parseFloat(hoursWorked) || 0;
    const fraisAmount = parseFloat(frais) || 0;
    const fraisDeplacementAmount = parseFloat(fraisDeplacement) || 0;

    const laborCost = hours * appointment.hourlyRate;
    const partsCost = selectedParts.reduce((sum, part) => sum + part.quantity * part.price, 0);

    const subtotal = laborCost + fraisAmount + fraisDeplacementAmount + partsCost;
    const tpsAmount = subtotal * TPS_RATE;
    const tvqAmount = subtotal * TVQ_RATE;
    const total = subtotal + tpsAmount + tvqAmount;

    return {
      laborCost,
      partsCost,
      subtotal,
      tpsAmount,
      tvqAmount,
      total,
    };
  };

  const filteredParts = availableParts.filter(
    (part) =>
      part.name.toLowerCase().includes(partSearchTerm.toLowerCase()) ||
      part.partId.toLowerCase().includes(partSearchTerm.toLowerCase())
  );

  const handleAddPart = (part: PartResponseModel) => {
    // Check if part already added
    if (selectedParts.some((p) => p.partId === part.partId)) {
      onError('This part is already added');
      return;
    }

    setSelectedParts([
      ...selectedParts,
      {
        partId: part.partId,
        partName: part.name,
        quantity: 1,
        price: 0, // Technician will set price manually
        notes: '',
      },
    ]);
    setShowPartSearch(false);
    setPartSearchTerm('');
  };

  const handleRemovePart = (partId: string) => {
    setSelectedParts(selectedParts.filter((p) => p.partId !== partId));
  };

  const handlePartChange = (
    partId: string,
    field: 'quantity' | 'price' | 'notes',
    value: string | number
  ) => {
    setSelectedParts(
      selectedParts.map((p) => (p.partId === partId ? { ...p, [field]: value } : p))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const hoursValue = parseFloat(hoursWorked) || 0;
    if (hoursValue < 0) {
      onError('Please enter valid hours worked');
      return;
    }

    const fraisValue = parseFloat(frais) || 0;
    if (fraisValue < 0) {
      onError('Please enter valid other costs amount');
      return;
    }

    const fraisDeplacementValue = parseFloat(fraisDeplacement) || 0;
    if (fraisDeplacementValue < 0) {
      onError('Please enter valid travel expenses amount');
      return;
    }

    // Validate parts
    for (const part of selectedParts) {
      if (part.quantity <= 0) {
        onError(`Invalid quantity for part ${part.partName}`);
        return;
      }
      if (part.price < 0) {
        onError(`Invalid price for part ${part.partName}`);
        return;
      }
    }

    const requestData: ReportRequestModel = {
      appointmentId: appointment.appointmentId,
      hoursWorked: hoursValue,
      frais: fraisValue,
      fraisDeplacement: fraisDeplacementValue,
      parts: selectedParts.map((p) => ({
        partId: p.partId,
        quantity: p.quantity,
        price: p.price,
        notes: p.notes || undefined,
      })),
    };

    try {
      setLoading(true);
      if (existingReport) {
        await updateReport(existingReport.reportId, requestData);
        onSuccess('Report updated successfully');
      } else {
        await createReport(requestData);
        onSuccess('Report created successfully');
      }
      onClose();
    } catch (error: unknown) {
      console.error('Error saving report:', error);
      let errorMessage = 'Failed to save report';
      if (typeof error === 'object' && error && 'response' in error) {
        const resp = (error as { response?: { data?: unknown } }).response;
        if (resp?.data) {
          if (typeof resp.data === 'string') {
            errorMessage = resp.data;
          } else if (typeof resp.data === 'object') {
            const data = resp.data as Record<string, unknown>;
            errorMessage = (data.message as string) || (data.error as string) || errorMessage;
          }
        }
      }
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const totals = calculateTotals();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content report-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {existingReport
              ? isFrench
                ? 'Modifier le Rapport'
                : 'Edit Report'
              : isFrench
                ? 'Créer un Rapport de Travail'
                : 'Create Work Report'}
          </h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="report-form">
          {/* Customer Information (Read-only) */}
          <div className="form-section">
            <h3>{isFrench ? 'Informations du Client' : 'Customer Information'}</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>{isFrench ? 'Nom du Client:' : 'Customer Name:'}</label>
                <span>
                  {appointment.customerFirstName} {appointment.customerLastName}
                </span>
              </div>
              <div className="info-item">
                <label>{isFrench ? 'Service:' : 'Job:'}</label>
                <span>{getJobName()}</span>
              </div>
              <div className="info-item">
                <label>{isFrench ? 'Date:' : 'Date:'}</label>
                <span>
                  {new Date(appointment.appointmentDate).toLocaleDateString(
                    isFrench ? 'fr-FR' : 'en-US'
                  )}
                </span>
              </div>
              <div className="info-item">
                <label>{isFrench ? 'Taux Horaire:' : 'Hourly Rate:'}</label>
                <span>${appointment.hourlyRate.toFixed(2)}/hr</span>
              </div>
            </div>
          </div>

          {/* Work Details */}
          <div className="form-section">
            <h3>{isFrench ? 'Détails du Travail' : 'Work Details'}</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="hoursWorked">
                  {isFrench ? 'Heures Travaillées' : 'Hours Worked'} *
                </label>
                <input
                  id="hoursWorked"
                  type="text"
                  step="0.25"
                  min="0"
                  placeholder="0"
                  value={hoursWorked}
                  onChange={(e) => setHoursWorked(sanitizeInput(e.target.value))}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="frais">{isFrench ? 'Autres Frais ($)' : 'Other Costs ($)'} *</label>
                <input
                  id="frais"
                  type="text"
                  step="0.01"
                  min="0"
                  className="no-arrows"
                  placeholder="0.00"
                  value={frais}
                  onChange={(e) => setFrais(sanitizeInput(e.target.value))}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="fraisDeplacement">
                  {isFrench ? 'Frais de Déplacement ($)' : 'Travel Expenses ($)'} *
                </label>
                <input
                  id="fraisDeplacement"
                  type="text"
                  step="0.01"
                  min="0"
                  className="no-arrows"
                  placeholder="0.00"
                  value={fraisDeplacement}
                  onChange={(e) => setFraisDeplacement(sanitizeInput(e.target.value))}
                  required
                />
              </div>
            </div>
          </div>

          {/* Parts Section */}
          <div className="form-section">
            <div className="section-header">
              <h3>{isFrench ? 'Pièces Utilisées' : 'Parts Used'}</h3>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowPartSearch(!showPartSearch)}
              >
                <Plus size={16} />
                {isFrench ? 'Ajouter une Pièce' : 'Add Part'}
              </button>
            </div>

            {/* Part Search */}
            {showPartSearch && (
              <div className="part-search-box">
                <div className="search-input-wrapper">
                  <Search size={18} />
                  <input
                    type="text"
                    placeholder={isFrench ? 'Rechercher des pièces...' : 'Search parts...'}
                    value={partSearchTerm}
                    onChange={(e) => setPartSearchTerm(sanitizeInput(e.target.value))}
                    autoFocus
                  />
                </div>
                <div className="part-search-results">
                  {loadingParts ? (
                    <div className="search-loading">
                      {isFrench ? 'Chargement des pièces...' : 'Loading parts...'}
                    </div>
                  ) : filteredParts.length === 0 ? (
                    <div className="search-empty">
                      {isFrench ? 'Aucune pièce trouvée' : 'No parts found'}
                    </div>
                  ) : (
                    filteredParts.map((part) => (
                      <div
                        key={part.partId}
                        className="part-search-item"
                        onClick={() => handleAddPart(part)}
                      >
                        <span className="part-name">{part.name}</span>
                        <span className="part-id">{part.partId}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Selected Parts */}
            {selectedParts.length === 0 ? (
              <div className="empty-parts">
                {isFrench ? 'Aucune pièce ajoutée' : 'No parts added yet'}
              </div>
            ) : (
              <div className="parts-list">
                {selectedParts.map((part) => (
                  <div key={part.partId} className="part-item">
                    <div className="part-item-header">
                      <span className="part-item-name">{part.partName}</span>
                      <button
                        type="button"
                        className="btn-icon-danger"
                        onClick={() => handleRemovePart(part.partId)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="part-item-inputs">
                      <div className="form-group-inline">
                        <label>{isFrench ? 'Qtité:' : 'Qty:'}</label>
                        <input
                          type="number"
                          min="1"
                          value={part.quantity}
                          onChange={(e) =>
                            handlePartChange(part.partId, 'quantity', parseInt(e.target.value) || 1)
                          }
                        />
                      </div>
                      <div className="form-group-inline">
                        <label>{isFrench ? 'Prix ($):' : 'Price ($):'}</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="no-arrows"
                          placeholder="0.00"
                          value={part.price || ''}
                          onChange={(e) =>
                            handlePartChange(part.partId, 'price', parseFloat(e.target.value) || 0)
                          }
                        />
                      </div>
                      <div className="form-group-inline total">
                        <label>{isFrench ? 'Total:' : 'Total:'}</label>
                        <span>${(part.quantity * part.price).toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="form-group">
                      <input
                        type="text"
                        placeholder={isFrench ? 'Notes (optionnel)' : 'Notes (optional)'}
                        value={part.notes}
                        onChange={(e) =>
                          handlePartChange(part.partId, 'notes', sanitizeInput(e.target.value))
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totals Section */}
          <div className="form-section totals-section">
            <h3>{isFrench ? 'Résumé' : 'Summary'}</h3>
            <div className="totals-grid">
              <div className="total-row">
                <span>
                  {isFrench ? "Coût de la Main-d'œuvre" : 'Labor Cost'} ({hoursWorked}h × $
                  {appointment.hourlyRate}/h):
                </span>
                <span>${totals.laborCost.toFixed(2)}</span>
              </div>
              <div className="total-row">
                <span>{isFrench ? 'Autres Frais:' : 'Other Costs:'}</span>
                <span>${parseFloat(frais || '0').toFixed(2)}</span>
              </div>
              <div className="total-row">
                <span>{isFrench ? 'Frais de Déplacement:' : 'Travel Expenses:'}</span>
                <span>${parseFloat(fraisDeplacement || '0').toFixed(2)}</span>
              </div>
              <div className="total-row">
                <span>{isFrench ? 'Coût des Pièces:' : 'Parts Cost:'}</span>
                <span>${totals.partsCost.toFixed(2)}</span>
              </div>
              <div className="total-row subtotal">
                <span>{isFrench ? 'Sous-total:' : 'Subtotal:'}</span>
                <span>${totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="total-row tax">
                <span>{isFrench ? 'TPS (5%):' : 'TPS (5%):'}</span>
                <span>${totals.tpsAmount.toFixed(2)}</span>
              </div>
              <div className="total-row tax">
                <span>{isFrench ? 'TVQ (9,975%):' : 'TVQ (9.975%):'}</span>
                <span>${totals.tvqAmount.toFixed(2)}</span>
              </div>
              <div className="total-row grand-total">
                <span>{isFrench ? 'Total:' : 'Grand Total:'}</span>
                <span>${totals.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              {isFrench ? 'Annuler' : 'Cancel'}
            </button>
            <button type="submit" className="btn-primary-report" disabled={loading}>
              {loading
                ? isFrench
                  ? 'Enregistrement...'
                  : 'Saving...'
                : existingReport
                  ? isFrench
                    ? 'Mettre à jour le Rapport'
                    : 'Update Report'
                  : isFrench
                    ? 'Créer le Rapport'
                    : 'Create Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
