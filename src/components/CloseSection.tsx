import React from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';

interface CloseSectionProps {
  onOpenBooking?: () => void;
}

export const CloseSection: React.FC<CloseSectionProps> = ({ onOpenBooking }) => {
  return (
    <footer className="close-section" role="contentinfo" aria-label="Closing Summary">
      <div className="close-container">
        {/* Top Split: Headline & Fine Print on Left, Buttons on Right */}
        <div className="close-top-split">
          <div className="close-headline-wrap">
            <h2 className="close-headline">DECODE THE SILENT INTENT.</h2>
            <p className="close-fine-print">
              Validated on the BCI Competition IV-2a multi-subject motor imagery dataset. 
              Zero-shot transfer ready with sub-18ms quantized inference. Engineered for 
              AI Manthan 2.0 // Domain: AI for Biomedical Engineering and Neurotechnology.
            </p>
          </div>

          <div className="close-buttons">
            {onOpenBooking && (
              <button
                type="button"
                className="btn-buy-now-pulse"
                onClick={onOpenBooking}
                aria-label="Buy Now / Book Hardware Kit"
              >
                <ShoppingBag size={14} className="buy-now-icon" />
                <span>BUY NOW // BOOK HARDWARE KIT</span>
                <ArrowRight size={13} />
              </button>
            )}

            <button
              type="button"
              className="btn-primary-outline"
              onClick={() => {
                alert('Exporting ONNX Quantized Model: eegnet_bci_ps03_quantized.onnx (2,480 parameters, 14.2ms inference)');
              }}
            >
              <span className="meta-accent-dot" />
              EXPORT ONNX MODEL
            </button>

            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                alert('Downloading 10-20 Sensorimotor Calibration Montage (C3-Cz-C4 128Hz)');
              }}
            >
              DOWNLOAD BCI DATASET →
            </button>
          </div>
        </div>

        {/* Dedicated Pre-Order / Booking Callout Strip at the End of the Page */}
        <div className="close-booking-strip">
          <div className="booking-strip-left">
            <div className="strip-badge-wrap">
              <span className="meta-accent-dot pulse" />
              <span className="strip-badge font-mono">BATCH 01 ALLOCATION OPEN</span>
            </div>
            <h3 className="strip-title">NEUROSYNC SENSORIMOTOR HARDWARE KITS</h3>
            <p className="strip-subtitle">
              Ready-to-deploy hardware with calibrated C3/Cz/C4 dry leads, low-latency BLE streamer, and embedded 1D-CNN artifact suppression.
            </p>
          </div>

          {onOpenBooking && (
            <button
              type="button"
              className="btn-buy-now-accent"
              onClick={onOpenBooking}
            >
              <span className="meta-accent-dot" />
              <span>BUY NOW / RESERVE SLOT</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>

        {/* Hairline Footer Strip */}
        <div className="close-footer-strip">
          <div className="footer-left">
            <span>AI MANTHAN 2.0</span>
            <span>//</span>
            <span>PROBLEM STATEMENT 3</span>
            <span>//</span>
            <span>NEUROTECHNOLOGY</span>
          </div>

          <div className="footer-right">
            <span>SYS_STATUS: 128HZ LIVE</span>
            <span>//</span>
            <span>LATENCY: 14.2 MS</span>
            <span>//</span>
            <span>© 2026 NEUROSYNC</span>
          </div>
        </div>
      </div>

      {/* Cropped Full-Width Wordmark at the Bottom Page Edge */}
      <div className="close-cropped-wordmark-wrap" aria-hidden="true">
        <span className="close-cropped-wordmark">
          NEUROSYNC
        </span>
      </div>
    </footer>
  );
};
