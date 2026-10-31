import React, { useState, useEffect, useRef, useCallback } from 'react';

type Direction = 'Left' | 'Right' | 'Up' | 'Down';

const CLASSES: Direction[] = ['Left', 'Right', 'Up', 'Down'];

export const LiveBciDecoderDemo: React.FC = () => {
  // Demo State
  const [hits, setHits] = useState<number>(0);
  const [latency, setLatency] = useState<number | string>('–');
  const [intent, setIntent] = useState<string>('–');
  const [probabilities, setProbabilities] = useState<number[]>([0.25, 0.25, 0.25, 0.25]);
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');

  // Coordinates stored as percentages (0-100)
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [targetPos, setTargetPos] = useState<{ x: number; y: number }>({ x: 80, y: 30 });
  const [isWsConnected, setIsWsConnected] = useState<boolean>(false);

  // References for mutable state in timers / socket callbacks
  const cursorRef = useRef(cursorPos);
  cursorRef.current = cursorPos;

  const targetRef = useRef(targetPos);
  targetRef.current = targetPos;

  const modeRef = useRef(mode);
  modeRef.current = mode;

  const arenaRef = useRef<HTMLDivElement>(null);

  // Show: Updates UI and returns the top class
  const show = useCallback((probsArray: number[], latVal: number | string) => {
    setProbabilities(probsArray);
    setLatency(latVal);

    // Find top class
    let maxIdx = 0;
    let maxVal = -1;
    probsArray.forEach((p, idx) => {
      if (p > maxVal) {
        maxVal = p;
        maxIdx = idx;
      }
    });

    const topClass = CLASSES[maxIdx];
    setIntent(topClass.toUpperCase());
    return topClass;
  }, []);

  // onIntent: Moves cursor 9% in direction and checks for target hit
  const onIntent = useCallback((dir: Direction) => {
    const curr = cursorRef.current;
    let nextX = curr.x;
    let nextY = curr.y;

    if (dir === 'Left') nextX -= 9;
    if (dir === 'Right') nextX += 9;
    if (dir === 'Up') nextY -= 9;
    if (dir === 'Down') nextY += 9;

    // Clamp horizontally 4-96% and vertically 6-94%
    nextX = Math.max(4, Math.min(96, nextX));
    nextY = Math.max(6, Math.min(94, nextY));

    setCursorPos({ x: nextX, y: nextY });

    // Distance check with Y axis scaled by 0.62 for 16/10 aspect ratio
    const currentTarget = targetRef.current;
    const distance = Math.hypot(nextX - currentTarget.x, (nextY - currentTarget.y) * 0.62);

    if (distance < 6.0) {
      setHits(prev => prev + 1);
      // Move target to random position (x: 10-90, y: 12-88)
      const newTargetX = 10 + Math.random() * 80;
      const newTargetY = 12 + Math.random() * 76;
      setTargetPos({ x: newTargetX, y: newTargetY });
    }
  }, []);

  // Generate fake probabilities favoring chosen direction
  const generateProbabilities = useCallback((favoredDir: Direction): number[] => {
    const raw = CLASSES.map(c => Math.random() * 0.25 + (c === favoredDir ? 0.5 : 0));
    const sum = raw.reduce((acc, v) => acc + v, 0);
    return raw.map(v => v / sum);
  }, []);

  // Step simulation: compute best direction, generate probs, trigger show and onIntent
  const executeSimulationStep = useCallback(() => {
    const c = cursorRef.current;
    const t = targetRef.current;

    const dx = t.x - c.x;
    const dy = t.y - c.y;

    let bestDir: Direction;
    if (Math.abs(dx) > 1.6 * Math.abs(dy)) {
      bestDir = dx > 0 ? 'Right' : 'Left';
    } else {
      bestDir = dy > 0 ? 'Down' : 'Up';
    }

    // 15% error rate simulation
    if (Math.random() < 0.15) {
      const otherClasses = CLASSES.filter(d => d !== bestDir);
      bestDir = otherClasses[Math.floor(Math.random() * otherClasses.length)];
    }

    /*
     * NOTE: PLUG REAL MODEL INFERENCE HERE!
     * When using a real neural model, replace fake probabilities with real softmax outputs:
     * const probs = await model.predict(eegWindow);
     */
    const fakeProbs = generateProbabilities(bestDir);
    const fakeLatency = Math.floor(38 + Math.random() * 27); // 38 to 64 ms

    const topClass = show(fakeProbs, fakeLatency);
    onIntent(topClass);
  }, [generateProbabilities, show, onIntent]);

  // Auto decode timer (runs every 650ms in auto mode when websocket is not streaming)
  useEffect(() => {
    if (mode !== 'auto' || isWsConnected) return;

    const interval = setInterval(() => {
      executeSimulationStep();
    }, 650);

    return () => clearInterval(interval);
  }, [mode, isWsConnected, executeSimulationStep]);

  // Manual Keyboard steering (Arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        // Prevent default scrolling when arrow keys are used
        e.preventDefault();

        let pressedDir: Direction;
        if (e.key === 'ArrowLeft') pressedDir = 'Left';
        else if (e.key === 'ArrowRight') pressedDir = 'Right';
        else if (e.key === 'ArrowUp') pressedDir = 'Up';
        else pressedDir = 'Down';

        const manualProbs = generateProbabilities(pressedDir);
        const latVal = Math.floor(40 + Math.random() * 22);
        show(manualProbs, latVal);
        onIntent(pressedDir);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [generateProbabilities, show, onIntent]);

  // Optional WebSocket Client (ws://localhost:8765) with safe fallback
  useEffect(() => {
    let ws: WebSocket | null = null;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    let isUnmounted = false;

    const connectWs = () => {
      try {
        ws = new WebSocket('ws://localhost:8765');

        ws.onopen = () => {
          if (!isUnmounted) setIsWsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (Array.isArray(data.probs) && data.probs.length === 4) {
              const lat = data.latency_ms ?? 52;
              const top = show(data.probs, lat);
              onIntent(top);
            }
          } catch {
            // Non-JSON or malformed payload, ignore safely
          }
        };

        ws.onclose = () => {
          if (!isUnmounted) {
            setIsWsConnected(false);
            // Retry after 5s without blocking simulation
            retryTimeout = setTimeout(connectWs, 5000);
          }
        };

        ws.onerror = () => {
          if (!isUnmounted) setIsWsConnected(false);
          ws?.close();
        };
      } catch {
        if (!isUnmounted) {
          setIsWsConnected(false);
          retryTimeout = setTimeout(connectWs, 5000);
        }
      }
    };

    connectWs();

    return () => {
      isUnmounted = true;
      if (retryTimeout) clearTimeout(retryTimeout);
      if (ws) ws.close();
    };
  }, [show, onIntent]);

  // Highest probability index
  const topProbIndex = probabilities.reduce((maxI, curr, i, arr) => curr > arr[maxI] ? i : maxI, 0);

  return (
    <section id="live-decoder-demo" className="decoder-demo-section" aria-label="Live BCI Decoder Demo">
      <div className="decoder-demo-container">
        
        {/* Prominent Section Header */}
        <div className="decoder-section-header">
          <div className="decoder-header-meta">
            <span className="meta-accent-dot" />
            <span className="label-caps">[03] LIVE BCI DECODER DEMO</span>
            {isWsConnected && (
              <span className="ws-live-pill">
                <span className="ws-live-dot" /> WS CONNECTED
              </span>
            )}
          </div>
          <h2 className="decoder-section-title">
            MOTOR-IMAGERY INTENT DECODER
          </h2>
          <p className="decoder-section-subtitle">
            Closed-loop decodification arena translating sensorimotor spatial patterns into 4-class directional navigation.
          </p>
        </div>

        {/* Responsive Two-Column Grid */}
        <div className="decoder-two-col-grid">
          
          {/* Left Card: HUD & Compact Target Arena */}
          <div className="decoder-card left-arena-card">
            {/* Top HUD Row */}
            <div className="decoder-hud-row">
              <div className="hud-metric">
                <span className="hud-label">HITS</span>
                <span className="hud-value">{hits}</span>
              </div>
              <div className="hud-metric">
                <span className="hud-label">LATENCY</span>
                <span className="hud-value">
                  {latency !== '–' ? `${latency} ms` : '–'}
                </span>
              </div>
              <div className="hud-metric">
                <span className="hud-label">INTENT</span>
                <span className="hud-value intent-highlight">{intent}</span>
              </div>
            </div>

            {/* Interactive Arena */}
            <div 
              ref={arenaRef}
              className="decoder-arena" 
              role="img" 
              aria-label={`BCI Interactive Arena. Cursor at ${Math.round(cursorPos.x)}%, ${Math.round(cursorPos.y)}%. Target at ${Math.round(targetPos.x)}%, ${Math.round(targetPos.y)}%.`}
            >
              {/* Target (36px circle with clean dashed blue border and solid inner dot) */}
              <div 
                className="decoder-target"
                style={{
                  left: `${targetPos.x}%`,
                  top: `${targetPos.y}%`
                }}
              >
                <div className="decoder-target-inner-dot" />
              </div>

              {/* White arrow-shaped mouse cursor with drop shadow */}
              <div 
                className="decoder-cursor"
                style={{
                  left: `${cursorPos.x}%`,
                  top: `${cursorPos.y}%`
                }}
              >
                <svg width="20" height="24" viewBox="0 0 24 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path 
                    d="M3 2L19.5 15.5L11.5 16.5L8.5 24L3 2Z" 
                    fill="#FFFFFF" 
                    stroke="#0A0C0E" 
                    strokeWidth="1.5" 
                    strokeLinejoin="round" 
                  />
                </svg>
              </div>
            </div>

            {/* Muted note underneath */}
            <p className="decoder-note">
              Simulated classifier stream. Arrow keys also steer. Plug your trained model into <code>onIntent()</code>.
            </p>
          </div>

          {/* Right Card: Class probabilities & Mode Toggles */}
          <div className="decoder-card right-probs-card">
            <div className="probs-header">
              <span className="probs-header-label">CLASS PROBABILITIES</span>
              <span className="probs-header-sub">4-CLASS DECODE</span>
            </div>

            {/* 4 Rows (Left, Right, Up, Down) */}
            <div className="probs-list">
              {CLASSES.map((className, idx) => {
                const prob = probabilities[idx] ?? 0.25;
                const percent = Math.round(prob * 100);
                const isTop = idx === topProbIndex;

                return (
                  <div key={className} className={`prob-row ${isTop ? 'is-top-class' : ''}`}>
                    <span className="prob-label">{className}</span>
                    <div className="prob-track">
                      <div 
                        className={`prob-fill ${isTop ? 'fill-top' : 'fill-muted'}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="prob-percent">{percent}%</span>
                  </div>
                );
              })}
            </div>

            {/* Toggle Buttons: Auto decode & Manual */}
            <div className="decoder-toggles-wrapper">
              <div className="decoder-toggles">
                <button
                  type="button"
                  className={`decoder-toggle-btn ${mode === 'auto' ? 'active' : ''}`}
                  onClick={() => setMode('auto')}
                  aria-pressed={mode === 'auto'}
                >
                  Auto decode
                </button>
                <button
                  type="button"
                  className={`decoder-toggle-btn ${mode === 'manual' ? 'active' : ''}`}
                  onClick={() => setMode('manual')}
                  aria-pressed={mode === 'manual'}
                >
                  Manual
                </button>
              </div>
              <span className="decoder-mode-hint">
                {mode === 'auto' ? '• Classifier running at 650ms cadence' : '• Arrow keys (←, →, ↑, ↓) steer'}
              </span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
