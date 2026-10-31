import React from 'react';

interface BenchmarkRow {
  metric: string;
  baseline: string;
  ourModel: string;
  latency: string;
  robustness: string;
}

const BENCHMARK_DATA: BenchmarkRow[] = [
  {
    metric: 'Left / Right Motor Imagery Accuracy',
    baseline: '78.2% (CSP + LDA)',
    ourModel: '96.4% ± 0.8%',
    latency: '14.2 ms',
    robustness: 'SNR > 4 dB (91.4% retained)'
  },
  {
    metric: 'Artifact Resistance (EOG Eyeblinks)',
    baseline: '52.4% (Severe Degradation)',
    ourModel: '92.6% Retained',
    latency: '+2.1 ms ICA',
    robustness: 'Wavelet Component Rejection'
  },
  {
    metric: 'Virtual Cursor Steering RMS Error',
    baseline: '38.6 px (Significant Jitter)',
    ourModel: '6.2 px RMS',
    latency: '< 18 ms Total',
    robustness: 'Kalman Velocity Smoothing'
  },
  {
    metric: 'Assistive Speller Matrix Throughput',
    baseline: '7.4 chars/min',
    ourModel: '18.9 chars/min',
    latency: '32 ms Dwell',
    robustness: 'Adaptive Bayesian Prior'
  },
  {
    metric: 'Zero-Shot Cross-Subject Generalization',
    baseline: '61.0%',
    ourModel: '88.5% Transfer',
    latency: '14.2 ms',
    robustness: 'Domain Adversarial Regularization'
  }
];

export const DatesTableSection: React.FC = () => {
  return (
    <section id="dates" className="dates-section" aria-label="Validation Benchmarks">
      <div className="dates-container">
        <div className="dates-header">
          <div className="statement-top-meta">
            <span className="meta-accent-dot" />
            <span className="label-caps">[05] VALIDATION &amp; BENCHMARK MATRIX</span>
          </div>
          <h2>EMPIRICAL PERFORMANCE MATRIX</h2>
        </div>

        <div className="dates-table-wrapper">
          <table className="dates-table">
            <thead>
              <tr>
                <th scope="col">EVALUATION METRIC</th>
                <th scope="col">BASELINE (CSP + LDA)</th>
                <th scope="col">OUR EEGNET PIPELINE</th>
                <th scope="col">INFERENCE LATENCY</th>
                <th scope="col">NOISE ROBUSTNESS</th>
              </tr>
            </thead>
            <tbody>
              {BENCHMARK_DATA.map((row, idx) => (
                <tr key={idx}>
                  <td className="col-display" data-label="Evaluation Metric">
                    {row.metric}
                  </td>
                  <td className="col-mono" data-label="Baseline">
                    {row.baseline}
                  </td>
                  <td className="col-accent" data-label="Our Pipeline">
                    {row.ourModel}
                  </td>
                  <td className="col-mono" data-label="Latency">
                    {row.latency}
                  </td>
                  <td className="col-mono" data-label="Robustness">
                    {row.robustness}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
