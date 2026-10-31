import React, { useState, useEffect, useRef } from 'react';

interface DashboardPageProps {
  onReturnHome: () => void;
  onOpenVirtualInterface: () => void;
}

type ElectrodeId = 'C3' | 'Cz' | 'C4' | 'F3' | 'F4' | 'P3' | 'P4' | 'Oz';

interface ElectrodeInfo {
  id: ElectrodeId;
  name: string;
  region: string;
  cx: number;
  cy: number;
  impedance: number; // in kOhm
  frequency: string;
  rhythm: string;
  snr: number;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onReturnHome,
  onOpenVirtualInterface
}) => {
  const [selectedElectrode, setSelectedElectrode] = useState<ElectrodeId>('C3');
  const [activeIntent, setActiveIntent] = useState<'REST' | 'LEFT_HAND' | 'RIGHT_HAND'>('REST');
  const [isRecording, setIsRecording] = useState<boolean>(true);
  const [sessionTrials, setSessionTrials] = useState<number>(1420);
  const [confidenceVal, setConfidenceVal] = useState<number>(96.8);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const ELECTRODES: Record<ElectrodeId, ElectrodeInfo> = {
    C3: { id: 'C3', name: 'Lead C3', region: 'Left Motor Cortex (Right Hand Imagery)', cx: 120, cy: 190, impedance: 2.1, frequency: '10.4 Hz', rhythm: 'Sensorimotor Mu / Beta', snr: 26.8 },
    Cz: { id: 'Cz', name: 'Lead Cz', region: 'Vertex Center (Foot / Trunk Imagery)', cx: 190, cy: 190, impedance: 1.9, frequency: '9.8 Hz', rhythm: 'Central Sensorimotor', snr: 28.1 },
    C4: { id: 'C4', name: 'Lead C4', region: 'Right Motor Cortex (Left Hand Imagery)', cx: 260, cy: 190, impedance: 2.3, frequency: '10.2 Hz', rhythm: 'Sensorimotor Mu / Beta', snr: 26.1 },
    F3: { id: 'F3', name: 'Lead F3', region: 'Frontal Left (Ocular EOG Reference)', cx: 135, cy: 125, impedance: 3.1, frequency: '14.2 Hz', rhythm: 'Frontal Beta', snr: 24.2 },
    F4: { id: 'F4', name: 'Lead F4', region: 'Frontal Right (Ocular EOG Reference)', cx: 245, cy: 125, impedance: 2.9, frequency: '14.0 Hz', rhythm: 'Frontal Beta', snr: 24.5 },
    P3: { id: 'P3', name: 'Lead P3', region: 'Parietal Left (Spatial Attention)', cx: 135, cy: 255, impedance: 3.4, frequency: '11.1 Hz', rhythm: 'Parietal Alpha', snr: 25.0 },
    P4: { id: 'P4', name: 'Lead P4', region: 'Parietal Right (Spatial Attention)', cx: 245, cy: 255, impedance: 3.2, frequency: '11.3 Hz', rhythm: 'Parietal Alpha', snr: 25.3 },
    Oz: { id: 'Oz', name: 'Lead Oz', region: 'Occipital (Visual Alpha Baseline)', cx: 190, cy: 300, impedance: 2.2, frequency: '11.8 Hz', rhythm: 'Dominant Alpha', snr: 27.6 }
  };

  const FREQ_BANDS = [
    { name: 'DELTA (δ)', range: '0.5 - 4 Hz', power: '12%', desc: 'Artifact baseline' },
    { name: 'THETA (θ)', range: '4 - 8 Hz', power: '18%', desc: 'Cognitive state' },
    { name: 'ALPHA (α)', range: '8 - 12 Hz', power: '42%', desc: 'Occipital rhythm' },
    { name: 'MU (μ)', range: '9 - 13 Hz', power: activeIntent === 'REST' ? '56%' : '18%', desc: 'Sensorimotor ERD lead', highlight: true },
    { name: 'BETA (β)', range: '14 - 30 Hz', power: activeIntent === 'REST' ? '28%' : '64%', desc: 'Motor cortical planning', highlight: true },
    { name: 'GAMMA (γ)', range: '30 - 50 Hz', power: '9%', desc: 'High-level synthesis' }
  ];

  const [liveTrials, setLiveTrials] = useState([
    { id: '#1420', time: '19:30:12', intent: 'RIGHT HAND', conf: '98.4%', action: 'Steer Virtual Cursor Right (+3.2px)', status: 'CONFIRMED' },
    { id: '#1419', time: '19:30:08', intent: 'RIGHT HAND', conf: '97.8%', action: 'Steer Virtual Cursor Right (+3.2px)', status: 'CONFIRMED' },
    { id: '#1418', time: '19:30:04', intent: 'REST', conf: '99.1%', action: 'Hover Reticle at Rest Center', status: 'BASELINE' },
    { id: '#1417', time: '19:30:00', intent: 'LEFT HAND', conf: '96.5%', action: 'Steer Virtual Cursor Left (-3.2px)', status: 'CONFIRMED' },
    { id: '#1416', time: '19:29:56', intent: 'LEFT HAND', conf: '97.2%', action: 'Dwell Confirmed: EMERGENCY NURSE CALL', status: 'DISPATCHED' }
  ]);

  // Autonomous stream simulation
  useEffect(() => {
    if (!isRecording) return;

    const interval = setInterval(() => {
      const intents: Array<'REST' | 'LEFT_HAND' | 'RIGHT_HAND'> = ['REST', 'LEFT_HAND', 'RIGHT_HAND', 'RIGHT_HAND', 'LEFT_HAND'];
      const pick = intents[Math.floor(Math.random() * intents.length)];
      setActiveIntent(pick);

      const conf = (95.5 + Math.random() * 3.8).toFixed(1);
      setConfidenceVal(parseFloat(conf));
      setSessionTrials((prev) => prev + 1);

      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      
      let actionStr = 'Hover at Center Baseline';
      if (pick === 'LEFT_HAND') actionStr = 'Steer Virtual Cursor Left (-3.2px)';
      if (pick === 'RIGHT_HAND') actionStr = 'Steer Virtual Cursor Right (+3.2px)';

      setLiveTrials((prev) => [
        {
          id: `#${sessionTrials + 1}`,
          time: timeStr,
          intent: pick.replace('_', ' '),
          conf: `${conf}%`,
          action: actionStr,
          status: 'CONFIRMED'
        },
        ...prev.slice(0, 4)
      ]);
    }, 3600);

    return () => clearInterval(interval);
  }, [isRecording, sessionTrials]);

  // 60fps Fluid Neural Spectral Flux Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const render = () => {
      t += 0.035;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Background grid
      ctx.strokeStyle = 'rgba(237, 231, 220, 0.03)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 36) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      // Draw 3 fluid undulating neural wave ribbons
      const ribbons = [
        { color: 'rgba(0, 210, 255, 0.75)', freq: 0.018, speed: 1.0, amp: 28, yOffset: h * 0.45 },
        { color: 'rgba(37, 99, 235, 0.55)', freq: 0.012, speed: 0.8, amp: 38, yOffset: h * 0.55 },
        { color: 'rgba(237, 231, 220, 0.35)', freq: 0.024, speed: 1.3, amp: 20, yOffset: h * 0.65 }
      ];

      ribbons.forEach((r) => {
        ctx.beginPath();
        ctx.strokeStyle = r.color;
        ctx.lineWidth = 1.8;

        for (let x = 0; x <= w; x += 3) {
          const wave1 = Math.sin(x * r.freq + t * r.speed);
          const wave2 = Math.cos(x * (r.freq * 0.6) - t * 0.5);
          const y = r.yOffset + (wave1 + wave2) * r.amp;

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, []);

  const currentElec = ELECTRODES[selectedElectrode];

  return (
    <div className="dashboard-page-container fluid-fade-in">
      {/* Top Header Bar */}
      <div className="dashboard-header-bar">
        <div className="dashboard-header-left">
          <button 
            type="button" 
            className="btn-ghost fluid-hover-lift" 
            onClick={onReturnHome}
            style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            ← RETURN TO HOME PORTAL
          </button>
          <div className="dashboard-title-wrap">
            <h1 className="dashboard-title">NEURAL TELEMETRY &amp; BCI DASHBOARD</h1>
            <p className="dashboard-subtitle">
              Problem Statement 3 // 8-Channel Motor Imagery Pipeline // Low-Latency Assistive Autonomy
            </p>
          </div>
        </div>

        <div className="dashboard-header-right">
          <div className="dashboard-status-pill">
            <span className="nav-pill-dot" />
            <span>OPENBCI LINK // 128 HZ ONLINE</span>
          </div>

          <button
            type="button"
            className="btn-primary-outline fluid-hover-lift"
            onClick={onOpenVirtualInterface}
          >
            <span className="meta-accent-dot" />
            LAUNCH VIRTUAL INTERFACE ARENA
          </button>
        </div>
      </div>

      {/* Top Stat Metrics Cards */}
      <div className="dashboard-metrics-row">
        <div className="dashboard-stat-card fluid-hover-glow">
          <div className="dashboard-stat-label">SESSION COHORT</div>
          <div className="dashboard-stat-value">SUB-03 // MOTOR IMAGERY</div>
          <div className="dashboard-stat-sub">10-20 Array (C3, Cz, C4 Leads)</div>
        </div>

        <div className="dashboard-stat-card fluid-hover-glow">
          <div className="dashboard-stat-label">DECODED INTENT TRIALS</div>
          <div className="dashboard-stat-value">{sessionTrials.toLocaleString()}</div>
          <div className="dashboard-stat-sub">Continuous Online Buffer</div>
        </div>

        <div className="dashboard-stat-card fluid-hover-glow">
          <div className="dashboard-stat-label">CURRENT MODEL CONFIDENCE</div>
          <div className="dashboard-stat-value text-accent-blue">{confidenceVal}%</div>
          <div className="dashboard-stat-sub">EEGNet Spatio-Temporal Depthwise</div>
        </div>

        <div className="dashboard-stat-card fluid-hover-glow">
          <div className="dashboard-stat-label">CLASSIFICATION LATENCY</div>
          <div className="dashboard-stat-value">14.2 ms</div>
          <div className="dashboard-stat-sub">Total Latency &lt; 18.0 ms Target</div>
        </div>
      </div>

      {/* Main Interactive Grid */}
      <div className="dashboard-main-grid">
        {/* Left Column: Interactive 10-20 Head SVG Map & Spectrum Analyzer */}
        <div className="dashboard-col">
          {/* Panel 1: Interactive 10-20 Head SVG Map */}
          <div className="dashboard-panel">
            <div className="dashboard-panel-header">
              <span className="panel-title">
                <span className="meta-accent-dot" />
                10-20 MONTAGE TOPOGRAPHY // CLICK TO INSPECT LEAD
              </span>
              <span className="card-code font-mono">SELECTED: {currentElec.id}</span>
            </div>

            <div className="head-map-container">
              {/* Interactive SVG Head Model */}
              <div className="head-svg-wrapper">
                <svg viewBox="0 0 380 380" className="head-svg" aria-label="10-20 Electrode Brain Montage">
                  {/* Nose indicator */}
                  <polygon points="190,20 178,48 202,48" fill="none" stroke="rgba(237,231,220,0.2)" strokeWidth="1.5" />
                  {/* Left Ear */}
                  <path d="M 45,170 Q 25,190 45,210" fill="none" stroke="rgba(237,231,220,0.2)" strokeWidth="1.5" />
                  {/* Right Ear */}
                  <path d="M 335,170 Q 355,190 335,210" fill="none" stroke="rgba(237,231,220,0.2)" strokeWidth="1.5" />
                  {/* Scalp Outer Circle */}
                  <circle cx="190" cy="190" r="148" fill="none" stroke="rgba(237,231,220,0.18)" strokeWidth="1.5" />
                  {/* Internal Grid Lines */}
                  <line x1="42" y1="190" x2="338" y2="190" stroke="rgba(237,231,220,0.06)" strokeDasharray="4 4" />
                  <line x1="190" y1="42" x2="190" y2="338" stroke="rgba(237,231,220,0.06)" strokeDasharray="4 4" />
                  <ellipse cx="190" cy="190" rx="95" ry="95" fill="none" stroke="rgba(237,231,220,0.06)" strokeDasharray="4 4" />

                  {/* Render Electrodes */}
                  {Object.values(ELECTRODES).map((elec) => {
                    const isSelected = selectedElectrode === elec.id;
                    const isMotor = elec.id === 'C3' || elec.id === 'C4' || elec.id === 'Cz';

                    return (
                      <g 
                        key={elec.id} 
                        className={`electrode-node-group ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedElectrode(elec.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        {/* Fluid Ripple Pulse Ring */}
                        <circle
                          cx={elec.cx}
                          cy={elec.cy}
                          r="16"
                          className={`fluid-electrode-ripple ${isSelected ? 'active-pulse' : ''}`}
                        />
                        {/* Center Electrode Contact */}
                        <circle
                          cx={elec.cx}
                          cy={elec.cy}
                          r={isSelected ? '12' : '9'}
                          fill={isSelected ? '#00D2FF' : isMotor ? '#162232' : '#0F1317'}
                          stroke={isSelected ? '#EDE7DC' : isMotor ? '#00D2FF' : 'rgba(237,231,220,0.3)'}
                          strokeWidth="1.5"
                          className="fluid-electrode-contact"
                        />
                        {/* Label */}
                        <text
                          x={elec.cx}
                          y={elec.cy + 3.5}
                          textAnchor="middle"
                          fill={isSelected ? '#0A0C0E' : isMotor ? '#00D2FF' : '#EDE7DC'}
                          fontSize="9"
                          fontFamily="'JetBrains Mono', monospace"
                          fontWeight="700"
                          pointerEvents="none"
                        >
                          {elec.id}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Selected Electrode Telemetry Card */}
              <div className="electrode-details-card">
                <div className="elec-badge-row">
                  <span className="card-code font-mono">{currentElec.name}</span>
                  <span className="channel-badge font-mono">IMPEDANCE &lt; 5kΩ</span>
                </div>
                <h3 className="elec-title">{currentElec.region}</h3>

                <div className="elec-specs-grid">
                  <div className="spec-box">
                    <span className="spec-label">IMPEDANCE</span>
                    <span className="spec-val font-mono text-accent-blue">{currentElec.impedance} kΩ</span>
                  </div>
                  <div className="spec-box">
                    <span className="spec-label">PEAK FREQ</span>
                    <span className="spec-val font-mono">{currentElec.frequency}</span>
                  </div>
                  <div className="spec-box">
                    <span className="spec-label">SNR QUALITY</span>
                    <span className="spec-val font-mono">{currentElec.snr} dB</span>
                  </div>
                  <div className="spec-box">
                    <span className="spec-label">RHYTHM</span>
                    <span className="spec-val font-mono">{currentElec.rhythm}</span>
                  </div>
                </div>

                <div className="elec-erd-status">
                  <span className="meta-accent-dot" />
                  <span className="font-mono" style={{ fontSize: '11px', color: '#9EA5A8' }}>
                    {selectedElectrode === 'C3' 
                      ? 'Desynchronizes (ERD) when user imagines Right Hand movement.' 
                      : selectedElectrode === 'C4'
                      ? 'Desynchronizes (ERD) when user imagines Left Hand movement.'
                      : 'Reference channel for baseline spatial noise cancellation.'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Panel 2: Live Fluid Neural Spectral Flux Canvas */}
          <div className="dashboard-panel" style={{ marginTop: '24px' }}>
            <div className="dashboard-panel-header">
              <span className="panel-title">
                <span className="meta-accent-dot" />
                REAL-TIME SPECTRAL FLUX DYNAMICS (60 FPS)
              </span>
              <span className="card-code font-mono">128 HZ SENSING</span>
            </div>

            <div className="fluid-flux-canvas-wrap">
              <canvas
                ref={canvasRef}
                width={560}
                height={160}
                className="fluid-canvas"
                aria-label="Real-time spectral flux wave visualizer"
              />
            </div>

            {/* Neural Frequency Bands */}
            <div className="freq-bands-grid">
              {FREQ_BANDS.map((b) => (
                <div key={b.name} className={`freq-band-card ${b.highlight ? 'highlight' : ''}`}>
                  <div className="freq-band-header">
                    <span className="freq-name">{b.name}</span>
                    <span className="freq-range font-mono">{b.range}</span>
                  </div>
                  <div className="freq-bar-bg">
                    <div 
                      className="freq-bar-fill" 
                      style={{ 
                        width: b.power,
                        backgroundColor: b.highlight ? '#00D2FF' : 'rgba(237,231,220,0.35)' 
                      }} 
                    />
                  </div>
                  <div className="freq-desc">{b.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Decoded Stream & Real-Time Controls */}
        <div className="dashboard-col">
          {/* Panel 3: Real-Time Trial Classification Stream */}
          <div className="dashboard-panel">
            <div className="dashboard-panel-header">
              <span className="panel-title">
                <span className="meta-accent-dot" />
                ONLINE INTENT DECODING STREAM
              </span>
              <span className="card-code font-mono">BUFFER: LIVE</span>
            </div>

            <div className="live-trials-list">
              {liveTrials.map((tr) => (
                <div key={tr.id} className="live-trial-item fluid-hover-lift">
                  <div className="trial-top-row">
                    <span className="trial-id font-mono">{tr.id}</span>
                    <span className="trial-time font-mono">{tr.time}</span>
                    <span className="trial-intent-badge font-mono">{tr.intent}</span>
                    <span className="trial-conf font-mono text-accent-blue">{tr.conf}</span>
                  </div>
                  <div className="trial-action font-mono">{tr.action}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Panel 4: Interactive Simulator & Hardware Bridge */}
          <div className="dashboard-panel" style={{ marginTop: '24px' }}>
            <div className="dashboard-panel-header">
              <span className="panel-title">
                <span className="meta-accent-dot" />
                MOTOR IMAGERY TRIGGER &amp; SESSION CONTROL
              </span>
              <span className="card-code font-mono">
                {isRecording ? 'STREAMING ACTIVE' : 'STREAM PAUSED'}
              </span>
            </div>

            <div className="dashboard-stim-buttons">
              <button
                type="button"
                className={`stim-btn fluid-hover-lift ${activeIntent === 'LEFT_HAND' ? 'active' : ''}`}
                onClick={() => {
                  setActiveIntent('LEFT_HAND');
                  setConfidenceVal(98.1);
                }}
              >
                TEST LEFT HAND IMAGERY
              </button>

              <button
                type="button"
                className={`stim-btn fluid-hover-lift ${activeIntent === 'REST' ? 'active' : ''}`}
                onClick={() => {
                  setActiveIntent('REST');
                  setConfidenceVal(99.2);
                }}
              >
                TEST REST BASELINE
              </button>

              <button
                type="button"
                className={`stim-btn fluid-hover-lift ${activeIntent === 'RIGHT_HAND' ? 'active' : ''}`}
                onClick={() => {
                  setActiveIntent('RIGHT_HAND');
                  setConfidenceVal(97.9);
                }}
              >
                TEST RIGHT HAND IMAGERY
              </button>
            </div>

            <div className="dashboard-actions-grid" style={{ marginTop: '18px' }}>
              <button
                type="button"
                className={`btn-primary-outline fluid-hover-lift ${!isRecording ? 'paused' : ''}`}
                onClick={() => setIsRecording(!isRecording)}
              >
                <span className="meta-accent-dot" />
                {isRecording ? 'PAUSE ONLINE STREAM' : 'RESUME ONLINE STREAM'}
              </button>

              <button
                type="button"
                className="btn-ghost fluid-hover-lift"
                onClick={() => alert('Calibrating 60-second sensorimotor rhythm baseline...')}
              >
                CALIBRATE BASELINE
              </button>

              <button
                type="button"
                className="btn-ghost fluid-hover-lift"
                onClick={() => alert('Exporting OpenBCI 8-Channel Telemetry Dataset (CSV format)...')}
              >
                EXPORT DATASET CSV →
              </button>

              <button
                type="button"
                className="btn-ghost fluid-hover-lift"
                onClick={onOpenVirtualInterface}
              >
                OPEN VIRTUAL CURSOR →
              </button>
            </div>

            <div className="dashboard-notes-strip">
              <span className="meta-accent-dot" />
              <span>
                Fluid UI/UX architecture. Connected directly to the motor imagery EEG classifier and assistive virtual interface.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
