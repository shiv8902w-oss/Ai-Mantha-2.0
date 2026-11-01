import React, { useState, useEffect, useCallback } from 'react';
import { X, Check, RotateCcw, ShieldCheck, Cpu, Truck, CheckCircle2 } from 'lucide-react';

export interface BookingFormData {
  fullName: string;
  email: string;
  phone: string;
  organization: string;
  role: string;
  tier: 'dev-kit' | 'clinical' | 'assistive';
  quantity: number;
  streetAddress: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
  notes: string;
}

const INITIAL_FORM: BookingFormData = {
  fullName: '',
  email: '',
  phone: '',
  organization: '',
  role: 'Researcher',
  tier: 'dev-kit',
  quantity: 1,
  streetAddress: '',
  city: '',
  stateProvince: '',
  postalCode: '',
  country: '',
  notes: ''
};

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState<BookingFormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [confirmedBookingId, setConfirmedBookingId] = useState<string | null>(null);
  const [clearToast, setClearToast] = useState<boolean>(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'quantity' ? Math.max(1, parseInt(value, 10) || 1) : value
    }));

    // Clear error for field once user types
    if (errors[name]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const handleClearForm = useCallback(() => {
    setFormData(INITIAL_FORM);
    setErrors({});
    setClearToast(true);
    setTimeout(() => setClearToast(false), 2400);
  }, []);

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      errs.fullName = 'Full Name is required.';
    }

    if (!formData.email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Please provide a valid email address.';
    }

    if (!formData.phone.trim()) {
      errs.phone = 'Phone / WhatsApp contact is required for shipping verification.';
    }

    if (!formData.streetAddress.trim()) {
      errs.streetAddress = 'Delivery street address is required.';
    }

    if (!formData.city.trim()) {
      errs.city = 'City is required.';
    }

    if (!formData.country.trim()) {
      errs.country = 'Country is required.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    // Simulate booking reservation generation
    setTimeout(() => {
      const generatedId = `NS-BCI-${Math.floor(100000 + Math.random() * 900000)}`;
      setConfirmedBookingId(generatedId);
      setIsSubmitting(false);
    }, 600);
  };

  const handleResetAndClose = () => {
    setConfirmedBookingId(null);
    setFormData(INITIAL_FORM);
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  const TIERS = [
    {
      id: 'dev-kit' as const,
      name: 'Developer Kit',
      badge: 'RECOMMENDED',
      desc: '3-Channel Sensorimotor Montage (C3/Cz/C4), 128Hz BLE Streamer, Python SDK + Quantized EEGNet weights.'
    },
    {
      id: 'clinical' as const,
      name: 'Research & Clinical Edition',
      badge: 'ENTERPRISE',
      desc: '8-Channel High-SNR Montage, 1D-CNN Real-Time Denoising Hardware unit, Multi-Subject Calibration Suite.'
    },
    {
      id: 'assistive' as const,
      name: 'Assistive Autonomy Unit',
      badge: 'ASSISTIVE TECH',
      desc: 'Ergonomic Wearable Headset, Kalman Velocity 2D Interface, Matrix Speller with 600ms dwell confirmation.'
    }
  ];

  const selectedTierObj = TIERS.find((t) => t.id === formData.tier) || TIERS[0];

  return (
    <div className="booking-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="booking-modal-title">
      <div className="booking-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="booking-modal-header">
          <div className="booking-header-meta">
            <span className="meta-accent-dot" />
            <span className="label-caps">[05] HARDWARE RESERVATION // BATCH 01</span>
          </div>

          <button
            type="button"
            className="booking-close-btn"
            onClick={handleResetAndClose}
            aria-label="Close booking modal"
          >
            <X size={18} />
          </button>
        </div>

        {confirmedBookingId ? (
          /* Confirmation Success Screen */
          <div className="booking-success-view">
            <div className="booking-success-icon-wrap">
              <CheckCircle2 size={48} className="success-icon" />
            </div>

            <h3 className="booking-success-title">RESERVATION CONFIRMED</h3>
            <p className="booking-success-sub">
              Your hardware slot in Batch 01 has been registered. An allocation verification package and reservation confirmation have been dispatched to <strong>{formData.email}</strong>.
            </p>

            <div className="booking-summary-card">
              <div className="summary-row">
                <span className="summary-label">BOOKING REFERENCE:</span>
                <span className="summary-val font-mono highlight">{confirmedBookingId}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">CLIENT NAME:</span>
                <span className="summary-val">{formData.fullName}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">HARDWARE PACKAGE:</span>
                <span className="summary-val">{selectedTierObj.name}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">QUANTITY:</span>
                <span className="summary-val">{formData.quantity} Unit(s)</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">DISPATCH DESTINATION:</span>
                <span className="summary-val">{formData.city}, {formData.country}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">ESTIMATED DISPATCH:</span>
                <span className="summary-val font-mono">Q2 2026 // BATCH 01 PRIORITY</span>
              </div>
            </div>

            <div className="booking-success-actions">
              <button
                type="button"
                className="btn-primary-outline"
                onClick={handleResetAndClose}
              >
                <Check size={14} />
                DONE &amp; RETURN TO SITE
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  setConfirmedBookingId(null);
                  setFormData(INITIAL_FORM);
                }}
              >
                BOOK ANOTHER UNIT →
              </button>
            </div>
          </div>
        ) : (
          /* Interactive Booking Form */
          <form className="booking-form" onSubmit={handleSubmit} noValidate>
            <div className="booking-form-intro">
              <h2 id="booking-modal-title" className="booking-form-title">
                BOOK NEUROSYNC BCI HARDWARE
              </h2>
              <p className="booking-form-subtitle">
                Fill in your details below to secure direct priority allocation for our certified sensorimotor EEG hardware kits. All units include preloaded 1D-CNN denoising modules and the sub-18ms intent engine.
              </p>
            </div>

            {clearToast && (
              <div className="booking-toast-alert" role="status">
                <RotateCcw size={13} />
                <span>Form fields cleared. Ready for new input.</span>
              </div>
            )}

            {/* Step 1: Select Hardware Package Tier */}
            <div className="form-section">
              <div className="section-header">
                <Cpu size={15} className="section-icon" />
                <span className="section-title">1. SELECT HARDWARE TIER</span>
              </div>

              <div className="tier-cards-grid">
                {TIERS.map((tier) => {
                  const isSelected = formData.tier === tier.id;
                  return (
                    <div
                      key={tier.id}
                      className={`tier-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setFormData((prev) => ({ ...prev, tier: tier.id }))}
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === ' ' || e.key === 'Enter') {
                          e.preventDefault();
                          setFormData((prev) => ({ ...prev, tier: tier.id }));
                        }
                      }}
                    >
                      <div className="tier-card-top">
                        <span className="tier-badge">{tier.badge}</span>
                      </div>
                      <h4 className="tier-name">{tier.name}</h4>
                      <p className="tier-desc">{tier.desc}</p>
                      <div className="tier-select-indicator">
                        {isSelected ? (
                          <span className="indicator-checked">
                            <Check size={12} /> SELECTED
                          </span>
                        ) : (
                          <span className="indicator-uncheck">SELECT PACKAGE</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Customer Contact Information */}
            <div className="form-section">
              <div className="section-header">
                <ShieldCheck size={15} className="section-icon" />
                <span className="section-title">2. CONTACT &amp; BASIC INFORMATION</span>
              </div>

              <div className="form-grid-2col">
                <div className="form-group">
                  <label htmlFor="fullName" className="form-label">
                    FULL NAME <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="e.g. Dr. Jane Doe"
                    className={`form-input ${errors.fullName ? 'has-error' : ''}`}
                    required
                  />
                  {errors.fullName && <span className="field-error">{errors.fullName}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    EMAIL ADDRESS <span className="req">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="jane.doe@university.edu"
                    className={`form-input ${errors.email ? 'has-error' : ''}`}
                    required
                  />
                  {errors.email && <span className="field-error">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="phone" className="form-label">
                    PHONE / WHATSAPP NUMBER <span className="req">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 019-2834"
                    className={`form-input ${errors.phone ? 'has-error' : ''}`}
                    required
                  />
                  {errors.phone && <span className="field-error">{errors.phone}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="organization" className="form-label">
                    ORGANIZATION / INSTITUTION / LAB
                  </label>
                  <input
                    type="text"
                    id="organization"
                    name="organization"
                    value={formData.organization}
                    onChange={handleInputChange}
                    placeholder="e.g. Neuroengineering Lab / Hospital"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="role" className="form-label">
                    PROFESSIONAL ROLE
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="form-select"
                  >
                    <option value="Researcher">Academic Researcher / Scientist</option>
                    <option value="Clinician">Physician / Clinician / Neurosurgeon</option>
                    <option value="Developer">Neurotech Hardware / Software Dev</option>
                    <option value="Assistive User">Assistive Technology Patient / Advocate</option>
                    <option value="Student">Biomedical Engineering Student</option>
                    <option value="Other">Other Specialized Role</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="quantity" className="form-label">
                    UNITS TO RESERVE
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    min="1"
                    max="50"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Shipping & Delivery Destination */}
            <div className="form-section">
              <div className="section-header">
                <Truck size={15} className="section-icon" />
                <span className="section-title">3. SHIPPING &amp; DELIVERY DESTINATION</span>
              </div>

              <div className="form-grid-2col">
                <div className="form-group full-width">
                  <label htmlFor="streetAddress" className="form-label">
                    STREET ADDRESS <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    id="streetAddress"
                    name="streetAddress"
                    value={formData.streetAddress}
                    onChange={handleInputChange}
                    placeholder="120 Innovation Way, Suite 400"
                    className={`form-input ${errors.streetAddress ? 'has-error' : ''}`}
                    required
                  />
                  {errors.streetAddress && <span className="field-error">{errors.streetAddress}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="city" className="form-label">
                    CITY <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Boston"
                    className={`form-input ${errors.city ? 'has-error' : ''}`}
                    required
                  />
                  {errors.city && <span className="field-error">{errors.city}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="stateProvince" className="form-label">
                    STATE / PROVINCE
                  </label>
                  <input
                    type="text"
                    id="stateProvince"
                    name="stateProvince"
                    value={formData.stateProvince}
                    onChange={handleInputChange}
                    placeholder="Massachusetts"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="postalCode" className="form-label">
                    POSTAL / ZIP CODE
                  </label>
                  <input
                    type="text"
                    id="postalCode"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    placeholder="02138"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="country" className="form-label">
                    COUNTRY <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    placeholder="United States"
                    className={`form-input ${errors.country ? 'has-error' : ''}`}
                    required
                  />
                  {errors.country && <span className="field-error">{errors.country}</span>}
                </div>

                <div className="form-group full-width">
                  <label htmlFor="notes" className="form-label">
                    RESEARCH APPLICATION &amp; SPECIAL REQUIREMENTS (OPTIONAL)
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={2}
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Describe your research focus, desired sampling frequency, or electrode placement specifications..."
                    className="form-textarea"
                  />
                </div>
              </div>
            </div>

            {/* Form Footer Actions: Clear Form and Submit */}
            <div className="booking-modal-footer">
              <button
                type="button"
                className="btn-clear-form"
                onClick={handleClearForm}
                title="Reset and clear all inputs in the form"
              >
                <RotateCcw size={13} />
                <span>CLEAR FORM</span>
              </button>

              <div className="footer-right-actions">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={handleResetAndClose}
                >
                  CANCEL
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-submit-booking"
                >
                  <span className="meta-accent-dot" />
                  <span>{isSubmitting ? 'RESERVING UNIT...' : 'CONFIRM BOOKING & RESERVE →'}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
