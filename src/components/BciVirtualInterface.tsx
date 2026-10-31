import React, { useState, useEffect, useRef, useCallback } from 'react';

type MotorIntent = 'REST' | 'LEFT_HAND' | 'RIGHT_HAND';
type AssistiveMode = 'CURSOR' | 'SPELLER';

interface TelemetryState {
  intent: MotorIntent;
  confidence: number;
  latency: number;
  snr: number;
  muPowerC3: number;
  muPowerC4: number;
}

interface EventLogItem {
  id: string;
  time: string;
  text: string;
  intent: MotorIntent;
  confidence: number;
}

export const BciVirtualInterface: React.FC = () => {
  // Simulator State
  const [activeIntent, setActiveIntent] = useState<MotorIntent>('REST');
  const [assistiveMode, setAssistiveMode] = useState<AssistiveMode>('CURSOR');
  const [icaFilterEnabled, setIcaFilterEnabled] = useState<boolean>(true);
  const [blinkArtifact, setBlinkArtifact] = useState<boolean>(false);
  const [noiseLevel, setNoiseLevel] = useState<number>(15); // 0-100%
  const [isAutoStreaming, setIsAutoStreaming] = useState<boolean>(true);

  // Telemetry
  const [telemetry, setTelemetry] = useState<TelemetryState>({
    intent: 'REST',
    confidence: 96.4,
    latency: 14.2,
    snr: 24.8,
    muPowerC3: 42,
    muPowerC4: 41
  });

  // Virtual Cursor Coordinates (Percentage 0-100)
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [hoveredTarget, setHoveredTarget] = useState<string | null>(null);
  const [dwellProgress, setDwellProgress] = useState<number>(0);
  const [eventLogs, setEventLogs] = useState<EventLogItem[]>([
    {
      id: 'init-1',
      time: '18:24:02',
      text: 'BCI Interface initialized. 8-Channel 10-20 montage active.',
      intent: 'REST',
      confidence: 98.1
    },
    {
      id: 'init-2',
      time: '18:24:04',
      text: 'Zero-phase Butterworth filter calibrated (8-30 Hz μ/β).',
      intent: 'REST',
      confidence: 97.4
    }
  ]);

  // Speller State
  const [spellerText, setSpellerText] = useState<string>('ASSIST ');
  const [spellerHighlightIdx, setSpellerHighlightIdx] = useState<number>(0);

  // Canvas Ref
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const wavePhase = useRef<number>(0);

  // Targets definition in Cursor Arena
  const TARGETS = [
    { id: 'nurse', label: 'NURSE CALL', x: 20, y: 24, text: 'Emergency alert sent to station' },
    { id: 'lights', label: 'ROOM LIGHTS', x: 80, y: 24, text: 'Environmental lighting toggled' },
    { id: 'water', label: 'WATER ASSIST', x: 20, y: 76, text: 'Hydration assistance requested' },
    { id: 'speller', label: 'SPELLER MATRIX', x: 80, y: 76, text: 'Speller matrix opened' }
  ];

  // Helper to add log
  const addLog = useCallback((text: string, intent: MotorIntent, confidence: number) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    setEventLogs((prev) => [
      {
        id: `${Date.now()}-${Math.random()}`,
        time: timeStr,
        text,
        intent,
        confidence
      },
      ...prev.slice(0, 5)
    ]);
  }, []);

  // Autonomous stream cyclic intent simulation
  useEffect(() => {
    if (!isAutoStreaming) return;

    let step = 0;
    const interval = setInterval(() => {
      step = (step + 1) % 6;
      if (step === 0 || step === 3) {
        setActiveIntent('REST');
      } else if (step === 1 || step === 2) {
        setActiveIntent('LEFT_HAND');
      } else {
        setActiveIntent('RIGHT_HAND');
      }
    }, 3800);

    return () => clearInterval(interval);
  }, [isAutoStreaming]);

  // Update Telemetry on Intent change
  useEffect(() => {
    let conf = 95.8 + Math.random() * 2.8;
    let lat = 13.8 + Math.random() * 1.6;
    let currentSnr = 26 - (noiseLevel / 100) * 12;

    let c3 = 40 + Math.random() * 5;
    let c4 = 40 + Math.random() * 5;

    // Motor Imagery Event-Related Desynchronization (ERD):
    // Left hand imagery causes power drop (ERD) on contralateral C4 lead
    // Right hand imagery causes power drop (ERD) on contralateral C3 lead
    if (activeIntent === 'LEFT_HAND') {
      c4 = 14 + Math.random() * 4; // ERD
      c3 = 48 + Math.random() * 6; // ERS
    } else if (activeIntent === 'RIGHT_HAND') {
      c3 = 13 + Math.random() * 4; // ERD
      c4 = 49 + Math.random() * 6; // ERS
    }

    setTelemetry({
      intent: activeIntent,
      confidence: parseFloat(conf.toFixed(1)),
      latency: parseFloat(lat.toFixed(1)),
      snr: parseFloat(currentSnr.toFixed(1)),
      muPowerC3: Math.round(c3),
      muPowerC4: Math.round(c4)
    });
  }, [activeIntent, noiseLevel]);

  // Move Virtual Cursor based on Intent
  useEffect(() => {
    const moveTimer = setInterval(() => {
      setCursorPos((prev) => {
        let targetX = prev.x;
        let targetY = prev.y;

        if (activeIntent === 'LEFT_HAND') {
          // Steer towards left
          targetX = Math.max(18, prev.x - 3.2);
          targetY = prev.y > 50 ? Math.min(76, prev.y + 1.2) : Math.max(24, prev.y - 1.2);
        } else if (activeIntent === 'RIGHT_HAND') {
          // Steer towards right
          targetX = Math.min(82, prev.x + 3.2);
          targetY = prev.y > 50 ? Math.min(76, prev.y + 1.2) : Math.max(24, prev.y - 1.2);
        } else {
          // Rest gently drifts toward center
          targetX = prev.x + (50 - prev.x) * 0.08;
          targetY = prev.y + (50 - prev.y) * 0.08;
        }

        return { x: targetX, y: targetY };
      });
    }, 50);

    return () => clearInterval(moveTimer);
  }, [activeIntent]);

  // Check target dwell in cursor arena
  useEffect(() => {
    let activeNearTarget: typeof TARGETS[0] | null = null;
    for (const t of TARGETS) {
      const dist = Math.hypot(cursorPos.x - t.x, cursorPos.y - t.y);
      if (dist < 14) {
        activeNearTarget = t;
        break;
      }
    }

    if (activeNearTarget) {
      setHoveredTarget(activeNearTarget.id);
      setDwellProgress((prev) => {
        if (prev >= 100) {
          // Dwell confirmed!
          addLog(`CONFIRMED: ${activeNearTarget!.label} (${activeNearTarget!.text})`, activeIntent, telemetry.confidence);
          if (activeNearTarget!.id === 'speller') {
            setAssistiveMode('SPELLER');
          }
          return 0; // reset
        }
        return prev + 12;
      });
    } else {
      setHoveredTarget(null);
      setDwellProgress(0);
    }
  }, [cursorPos, activeIntent, telemetry.confidence, addLog]);

  // 60 FPS Real-time EEG Multi-channel Waveform Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const channels = [
      { name: 'C3 (Motor L)', baseFreq: 10, isMotor: true, side: 'L' },
      { name: 'Cz (Vertex)', baseFreq: 9, isMotor: true, side: 'M' },
      { name: 'C4 (Motor R)', baseFreq: 10, isMotor: true, side: 'R' },
      { name: 'F3 (Frontal L)', baseFreq: 14, isMotor: false, side: 'L' },
      { name: 'F4 (Frontal R)', baseFreq: 14, isMotor: false, side: 'R' },
      { name: 'P3 (Parietal L)', baseFreq: 11, isMotor: false, side: 'L' },
      { name: 'P4 (Parietal R)', baseFreq: 11, isMotor: false, side: 'R' },
      { name: 'Oz (Visual)', baseFreq: 12, isMotor: false, side: 'M' }
    ];

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Background grid
      ctx.strokeStyle = 'rgba(237, 231, 220, 0.04)';
      ctx.lineWidth = 1;
      const gridSpacing = 28;
      for (let x = 0; x < width; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      const numChannels = channels.length;
      const channelHeight = height / numChannels;
      wavePhase.current += 0.08;

      channels.forEach((ch, idx) => {
        const centerY = channelHeight * idx + channelHeight / 2;

        // Channel label
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillStyle = ch.isMotor ? '#00D2FF' : '#6C7378';
        ctx.fillText(ch.name, 10, centerY - 8);

        // Amplitude factor based on Motor Imagery ERD
        let amp = 14;
        if (ch.side === 'L' && activeIntent === 'RIGHT_HAND') {
          amp = 4; // ERD on C3 during right hand imagery
        } else if (ch.side === 'R' && activeIntent === 'LEFT_HAND') {
          amp = 4; // ERD on C4 during left hand imagery
        }

        // Trace line
        ctx.beginPath();
        ctx.strokeStyle = ch.isMotor ? 'rgba(0, 210, 255, 0.85)' : 'rgba(237, 231, 220, 0.45)';
        ctx.lineWidth = ch.isMotor ? 1.5 : 1;

        for (let x = 85; x < width; x += 3) {
          const t = (x / width) * 12 + wavePhase.current;
          
          // Primary rhythm (Mu/Beta)
          let y = Math.sin(t * (ch.baseFreq * 0.18)) * amp;
          // Beta harmonic
          y += Math.sin(t * 3.8 + idx) * (amp * 0.45);
          
          // Noise component
          if (noiseLevel > 0) {
            const noise = (Math.sin(t * 19.3 + idx * 7) + Math.cos(t * 31.7)) * (noiseLevel * 0.22);
            y += noise;
          }

          // Eye blink artifact (high amplitude slow deflection on frontal channels)
          if (blinkArtifact && (ch.name.includes('F3') || ch.name.includes('F4'))) {
            if (!icaFilterEnabled) {
              const blinkX = (Math.sin(wavePhase.current * 0.8) + 1) * (width / 2);
              const blinkDist = Math.abs(x - blinkX);
              if (blinkDist < 50) {
                y += Math.cos((blinkDist / 50) * Math.PI) * 45; // large blink wave
              }
            }
          }

          const plotY = centerY + y;
          if (x === 85) {
            ctx.moveTo(x, plotY);
          } else {
            ctx.lineTo(x, plotY);
          }
        }
        ctx.stroke();

        // Hairline separator
        ctx.strokeStyle = 'rgba(237, 231, 220, 0.05)';
        ctx.beginPath();
        ctx.moveTo(0, channelHeight * (idx + 1));
        ctx.lineTo(width, channelHeight * (idx + 1));
        ctx.stroke();
      });

      animationFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isRunning = false;
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [activeIntent, blinkArtifact, icaFilterEnabled, noiseLevel]);

  // Speller Matrix definition
  const SPELLER_KEYS = [
    'A', 'B', 'C', 'D', 'E', 'F',
    'G', 'H', 'I', 'J', 'K', 'L',
    'M', 'N', 'O', 'P', 'Q', 'R',
    'S', 'T', 'U', 'V', 'W', 'X',
    'Y', 'Z', '1', '2', '3', '4',
    'HELP', 'YES', 'NO', 'WATER', 'SPACE', 'CLEAR'
  ];

  // Advance speller highlight cyclically
  useEffect(() => {
    if (assistiveMode !== 'SPELLER') return;

    const interval = setInterval(() => {
      setSpellerHighlightIdx((prev) => (prev + 1) % SPELLER_KEYS.length);
    }, 420);

    return () => clearInterval(interval);
  }, [assistiveMode, SPELLER_KEYS.length]);

  const handleSelectKey = (key: string) => {
    if (key === 'CLEAR') {
      setSpellerText('');
    } else if (key === 'SPACE') {
      setSpellerText((prev) => prev + ' ');
    } else if (key === 'HELP' || key === 'YES' || key === 'NO' || key === 'WATER') {
      setSpellerText((prev) => prev + key + ' ');
      addLog(`SPELLER TYPED: ${key}`, activeIntent, telemetry.confidence);
    } else {
      setSpellerText((prev) => prev + key);
    }
  };

  return (
    <section id="bci-lab" className="bci-section" aria-label="Interactive BCI Lab">
      <div className="bci-container">
        {/* Section Header with Telemetry Badges */}
        <div className="bci-header">
          <div className="bci-title-group">
            <div className="statement-top-meta">
              <span className="meta-accent-dot" />
              <span className="label-caps">[03] HACKATHON PROTOTYPE // BCI VIRTUAL INTERFACE</span>
            </div>
            <h2>REAL-TIME INTENT DECODER &amp; ASSISTIVE AUTONOMY</h2>
          </div>

          <div className="bci-header-metrics">
            <div className="bci-telemetry-badge">
              <span className="bci-telemetry-label">DECODED INTENT</span>
              <span className="bci-telemetry-value">
                <span className="meta-accent-dot" />
                {telemetry.intent.replace('_', ' ')}
              </span>
            </div>
            <div className="bci-telemetry-badge">
              <span className="bci-telemetry-label">CONFIDENCE</span>
              <span className="bci-telemetry-value">{telemetry.confidence}%</span>
            </div>
            <div className="bci-telemetry-badge">
              <span className="bci-telemetry-label">LATENCY</span>
              <span className="bci-telemetry-value">{telemetry.latency} ms</span>
            </div>
            <div className="bci-telemetry-badge">
              <span className="bci-telemetry-label">SNR</span>
              <span className="bci-telemetry-value">{telemetry.snr} dB</span>
            </div>
          </div>
        </div>

        {/* Workbench Main Grid */}
        <div className="bci-workbench">
          {/* Left Column: 8-Channel EEG Streamer & Signal Lab */}
          <div className="bci-signal-panel">
            <div className="panel-subhead">
              <span className="panel-title">
                <span className="meta-accent-dot" />
                MULTI-CHANNEL EEG STREAM (10-20 ARRAY // 128 Hz)
              </span>
              <span className="card-code font-mono">
                {icaFilterEnabled ? 'ICA DENOISER [ON]' : 'RAW CONTAMINATED'}
              </span>
            </div>

            {/* The 60fps Canvas */}
            <div className="eeg-canvas-wrapper">
              <canvas
                ref={canvasRef}
                width={620}
                height={280}
                className="eeg-canvas"
                aria-label="Real-time multi-channel EEG waveform stream visualizer"
              />
            </div>

            {/* Channel Topography & Contralateral Power Gauges */}
            <div className="eeg-channel-legend">
              <div className="legend-item">
                <span className={`legend-indicator ${activeIntent === 'RIGHT_HAND' ? 'active' : ''}`} />
                <span>C3 (L-Motor): {telemetry.muPowerC3}μV²</span>
              </div>
              <div className="legend-item">
                <span className="legend-indicator" />
                <span>Cz (Vertex): 38μV²</span>
              </div>
              <div className="legend-item">
                <span className={`legend-indicator ${activeIntent === 'LEFT_HAND' ? 'active' : ''}`} />
                <span>C4 (R-Motor): {telemetry.muPowerC4}μV²</span>
              </div>
              <div className="legend-item">
                <span className="legend-indicator" />
                <span>F3/F4: 18μV²</span>
              </div>
            </div>

            {/* Interactive Motor Imagery Trigger Controls */}
            <div className="bci-stimulator-controls">
              <div className="stim-label">
                SIMULATE MOTOR IMAGERY INTENT // OBSERVE CONTRALATERAL ERD
              </div>

              <div className="stim-buttons">
                <button
                  type="button"
                  className={`stim-btn ${activeIntent === 'LEFT_HAND' ? 'active' : ''}`}
                  onClick={() => {
                    setIsAutoStreaming(false);
                    setActiveIntent('LEFT_HAND');
                  }}
                >
                  IMAGINE LEFT HAND
                </button>

                <button
                  type="button"
                  className={`stim-btn ${activeIntent === 'REST' ? 'active' : ''}`}
                  onClick={() => {
                    setIsAutoStreaming(false);
                    setActiveIntent('REST');
                  }}
                >
                  REST / NEUTRAL
                </button>

                <button
                  type="button"
                  className={`stim-btn ${activeIntent === 'RIGHT_HAND' ? 'active' : ''}`}
                  onClick={() => {
                    setIsAutoStreaming(false);
                    setActiveIntent('RIGHT_HAND');
                  }}
                >
                  IMAGINE RIGHT HAND
                </button>
              </div>

              {/* Robustness & Artifact Controls */}
              <div className="bci-toggles-row">
                <div className="toggle-group">
                  <button
                    type="button"
                    className={`toggle-chip ${isAutoStreaming ? 'enabled' : ''}`}
                    onClick={() => setIsAutoStreaming(!isAutoStreaming)}
                  >
                    AUTONOMOUS STREAM: {isAutoStreaming ? 'RUNNING' : 'PAUSED'}
                  </button>

                  <button
                    type="button"
                    className={`toggle-chip ${blinkArtifact ? 'enabled' : ''}`}
                    onClick={() => setBlinkArtifact(!blinkArtifact)}
                  >
                    EYE BLINK ARTIFACT: {blinkArtifact ? 'INJECTED' : 'OFF'}
                  </button>

                  <button
                    type="button"
                    className={`toggle-chip ${icaFilterEnabled ? 'enabled' : ''}`}
                    onClick={() => setIcaFilterEnabled(!icaFilterEnabled)}
                  >
                    FASTICA FILTER: {icaFilterEnabled ? 'ACTIVE' : 'BYPASS'}
                  </button>
                </div>

                <div className="toggle-group">
                  <span className="toggle-label font-mono">NOISE:</span>
                  <input
                    type="range"
                    min={0}
                    max={60}
                    value={noiseLevel}
                    onChange={(e) => setNoiseLevel(Number(e.target.value))}
                    style={{ accentColor: '#00D2FF', width: '90px' }}
                    aria-label="Adjust Signal Noise Level"
                  />
                  <span className="metric-label font-mono">{noiseLevel}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Virtual Assistive Interface (Cursor & Speller) */}
          <div className="bci-assistive-panel">
            <div className="panel-subhead">
              <span className="panel-title">
                <span className="meta-accent-dot" />
                ASSISTIVE INTERFACE CONTROLLER
              </span>

              <div className="assistive-mode-tabs">
                <button
                  type="button"
                  className={`mode-tab-btn ${assistiveMode === 'CURSOR' ? 'active' : ''}`}
                  onClick={() => setAssistiveMode('CURSOR')}
                >
                  2D CURSOR
                </button>
                <button
                  type="button"
                  className={`mode-tab-btn ${assistiveMode === 'SPELLER' ? 'active' : ''}`}
                  onClick={() => setAssistiveMode('SPELLER')}
                >
                  SPELLER MATRIX
                </button>
              </div>
            </div>

            {/* Mode 1: 2D Virtual Cursor Arena */}
            {assistiveMode === 'CURSOR' ? (
              <div className="assistive-cursor-arena">
                <div className="arena-crosshairs" />

                {/* Targets */}
                {TARGETS.map((target) => {
                  const isHovered = hoveredTarget === target.id;
                  return (
                    <div
                      key={target.id}
                      className={`arena-target target-${target.id} ${isHovered ? 'hovered' : ''}`}
                      onClick={() => {
                        addLog(`MANUAL CLICK: ${target.label}`, activeIntent, 99.2);
                        if (target.id === 'speller') setAssistiveMode('SPELLER');
                      }}
                    >
                      <span className="target-text">{target.label}</span>
                      {isHovered && (
                        <div
                          className="dwell-progress-bar"
                          style={{ width: `${dwellProgress}%` }}
                        />
                      )}
                    </div>
                  );
                })}

                {/* The Virtual Cursor */}
                <div
                  className="bci-virtual-cursor"
                  style={{
                    left: `${cursorPos.x}%`,
                    top: `${cursorPos.y}%`
                  }}
                  aria-hidden="true"
                >
                  <div className="cursor-reticle-outer">
                    <div className="cursor-reticle-inner" />
                  </div>
                </div>
              </div>
            ) : (
              /* Mode 2: Virtual Speller Matrix Keyboard */
              <div className="assistive-speller-arena">
                <div className="speller-output-box">
                  <span>
                    {spellerText}
                    <span className="speller-cursor-blink" />
                  </span>
                  <button
                    type="button"
                    className="metric-label font-mono"
                    style={{ color: '#00D2FF' }}
                    onClick={() => {
                      if ('speechSynthesis' in window && spellerText.trim()) {
                        const utterance = new SpeechSynthesisUtterance(spellerText);
                        window.speechSynthesis.speak(utterance);
                      }
                    }}
                  >
                    SPEAK 🔊
                  </button>
                </div>

                <div className="speller-matrix-grid">
                  {SPELLER_KEYS.map((key, i) => (
                    <button
                      key={key}
                      type="button"
                      className={`speller-cell ${i === spellerHighlightIdx ? 'selected' : ''}`}
                      onClick={() => handleSelectKey(key)}
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Assistive Dispatch Confirmation Log */}
            <div className="assistive-event-log">
              <div className="log-title">
                REAL-TIME EVENT BUS // LOW-LATENCY DISPATCH
              </div>

              <ul className="log-entries">
                {eventLogs.map((log) => (
                  <li key={log.id} className="log-entry">
                    <span className="log-time font-mono">[{log.time}]</span>
                    <span className="meta-accent-dot" />
                    <span>{log.text}</span>
                    <span className="log-text-accent font-mono">({log.confidence}%)</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
