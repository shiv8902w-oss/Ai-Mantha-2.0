import React from 'react';

export const CloseSection: React.FC = () => {
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
            <span>© 2026 NEUROSYNAPSE</span>
          </div>
        </div>
      </div>

      {/* Cropped Full-Width Wordmark at the Bottom Page Edge */}
      <div className="close-cropped-wordmark-wrap" aria-hidden="true">
        <span className="close-cropped-wordmark">
          NEUROSYNAPSE
        </span>
      </div>
    </footer>
  );
};
