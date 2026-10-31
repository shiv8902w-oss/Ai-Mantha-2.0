import React from 'react';

interface RosterItem {
  id: string;
  label: string;
  name: string;
  count: string;
}

const ROSTER_ITEMS: RosterItem[] = [
  {
    id: 'roster-1',
    label: 'LEAD ARRAY',
    name: 'Bilateral 10-20 Sensorimotor Montage (C3, Cz, C4)',
    count: '128 Hz'
  },
  {
    id: 'roster-2',
    label: 'PREPROCESSOR',
    name: 'Zero-Phase IIR Bandpass & 50Hz Notch Filter',
    count: '8–30 Hz'
  },
  {
    id: 'roster-3',
    label: 'ARTIFACT FILTER',
    name: 'FastICA Ocular (EOG) & Myographic (EMG) Subsystem',
    count: '+14.2 dB'
  },
  {
    id: 'roster-4',
    label: 'SPATIAL FILTER',
    name: 'Regularized Common Spatial Pattern (r-CSP)',
    count: '6 Filters'
  },
  {
    id: 'roster-5',
    label: 'NEURAL NET',
    name: 'EEGNet Compact Spatio-Temporal Depthwise CNN',
    count: '2,480 Params'
  },
  {
    id: 'roster-6',
    label: 'INFERENCE RUNTIME',
    name: 'Quantized ONNX WebAssembly Low-Latency Engine',
    count: '14.2 ms'
  },
  {
    id: 'roster-7',
    label: 'INTERFACE BUS',
    name: 'Kalman-Filtered Virtual Cursor & Dwell Controller',
    count: '4 Targets'
  },
  {
    id: 'roster-8',
    label: 'VALIDATION',
    name: 'BCI Competition IV-2a 4-Class Motor Imagery Dataset',
    count: '96.4% Acc'
  }
];

export const RosterSection: React.FC = () => {
  return (
    <section id="roster" className="roster-section" aria-label="System Roster">
      <div className="roster-container">
        <div className="roster-header">
          <div className="statement-top-meta">
            <span className="meta-accent-dot" />
            <span className="label-caps">[04] ARCHITECTURE &amp; SUBSYSTEM ROSTER</span>
          </div>
          <h2>SUBSYSTEM SPECIFICATIONS</h2>
        </div>

        <div className="roster-rows">
          {ROSTER_ITEMS.map((item) => (
            <div key={item.id} className="roster-row">
              <div className="roster-accent-label">
                <span className="meta-accent-dot" />
                <span>{item.label}</span>
              </div>
              <div className="roster-name">{item.name}</div>
              <div className="roster-count">{item.count}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
