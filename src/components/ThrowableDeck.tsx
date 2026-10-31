import React, { useState, useRef, useCallback } from 'react';

export interface BciSleeve {
  id: string;
  code: string;
  tag: string;
  title: string;
  desc: string;
  metric1Label: string;
  metric1Val: string;
  metric2Label: string;
  metric2Val: string;
  status: string;
}

const SLEEVES: BciSleeve[] = [
  {
    id: 'sleeve-1',
    code: 'BCI-01 // RHYTHM',
    tag: 'PREPROCESSING',
    title: 'Butterworth Bandpass & Notch Filter',
    desc: '4th-order zero-phase IIR digital filter isolating sensorimotor Mu (8–12 Hz) and Beta (16–24 Hz) rhythms from C3/C4 leads, paired with a 50Hz notch filter eliminating mains electrical contamination.',
    metric1Label: 'PASSBAND',
    metric1Val: '8.0 – 30.0 Hz',
    metric2Label: 'FILTER ORDER',
    metric2Val: '4 (Zero-Phase)',
    status: '128 Hz STREAM VERIFIED'
  },
  {
    id: 'sleeve-2',
    code: 'BCI-02 // DENOISING',
    tag: 'ARTIFACT REJECTION',
    title: 'FastICA Ocular & EMG Decoupling',
    desc: 'Independent Component Analysis decomposes raw multi-channel scalp potentials into independent source signals, automatically stripping high-amplitude EOG blinks and EMG muscular spikes from motor leads.',
    metric1Label: 'SNR GAIN',
    metric1Val: '+14.2 dB',
    metric2Label: 'REJECTION ACC',
    metric2Val: '98.4%',
    status: 'ARTIFACT SUPPRESSION ACTIVE'
  },
  {
    id: 'sleeve-3',
    code: 'BCI-03 // SPATIAL',
    tag: 'SPATIAL FILTERING',
    title: 'Regularized Common Spatial Pattern',
    desc: 'Computes optimal spatial filters that maximize the variance ratio between Left Hand and Right Hand motor imagery trials, providing strong spatial discrimination over the contralateral sensorimotor cortex.',
    metric1Label: 'EIGENPAIRS',
    metric1Val: '6 Filters (3 Pairs)',
    metric2Label: 'FISHER RATIO',
    metric2Val: '4.82 λ_max',
    status: 'SPATIAL PROJECTORS LOADED'
  },
  {
    id: 'sleeve-4',
    code: 'BCI-04 // CLASSIFIER',
    tag: 'DEEP ARCHITECTURE',
    title: 'EEGNet Spatio-Temporal CNN',
    desc: 'A compact 2,480-parameter neural network utilizing 2D temporal convolution followed by depthwise spatial filters and separable convolutions, decoding Event-Related Desynchronization (ERD) with minimal compute.',
    metric1Label: 'PARAMETERS',
    metric1Val: '2,480 Params',
    metric2Label: 'CLASSIFICATION ACC',
    metric2Val: '96.4% ± 0.8%',
    status: 'ONNX QUANTIZED ENGINE'
  },
  {
    id: 'sleeve-5',
    code: 'BCI-05 // INTERFACE',
    tag: 'ASSISTIVE AUTONOMY',
    title: 'Low-Latency Virtual Bridge',
    desc: 'Event-driven command dispatcher with Kalman velocity smoothing, steering a 2D assistive cursor and predictive matrix speller with 600ms dwell confirmation and sub-18ms total system latency.',
    metric1Label: 'TOTAL LATENCY',
    metric1Val: '14.2 ms',
    metric2Label: 'DWELL CONFIRM',
    metric2Val: '600 ms',
    status: 'ASSISTIVE BUS READY'
  }
];

export const ThrowableDeck: React.FC = () => {
  const [deckIndices, setDeckIndices] = useState<number[]>([0, 1, 2, 3, 4]);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [tossingState, setTossingState] = useState<{ direction: 'left' | 'right' } | null>(null);

  const deckRef = useRef<HTMLDivElement>(null);
  const startPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Function to execute a throw
  const executeThrow = useCallback((direction: 'left' | 'right') => {
    setTossingState({ direction });

    setTimeout(() => {
      setDeckIndices((prev) => {
        const next = [...prev];
        const top = next.shift();
        if (top !== undefined) {
          next.push(top);
        }
        return next;
      });
      setTossingState(null);
      setDragOffset({ x: 0, y: 0 });
      setIsDragging(false);
    }, 280);
  }, []);

  // Pointer Down
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (tossingState) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    startPos.current = { x: e.clientX, y: e.clientY };
    setIsDragging(true);
  };

  // Pointer Move
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || tossingState) return;
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    setDragOffset({ x: dx, y: dy });
  };

  // Pointer Up / Cancel
  const handlePointerUp = () => {
    if (!isDragging || tossingState) return;

    const deckWidth = deckRef.current ? deckRef.current.clientWidth : 400;
    const threshold = Math.max(40, deckWidth * 0.1); // roughly a tenth of deck width

    if (Math.abs(dragOffset.x) > threshold) {
      const direction = dragOffset.x > 0 ? 'right' : 'left';
      executeThrow(direction);
    } else {
      // Spring back
      setDragOffset({ x: 0, y: 0 });
      setIsDragging(false);
    }
  };

  // Keyboard navigation for accessibility
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (tossingState) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      executeThrow('right');
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      executeThrow('left');
    }
  };

  // Active top sleeve
  const topSleeveIndex = deckIndices[0];

  return (
    <div className="deck-col">
      <div
        ref={deckRef}
        className="deck-viewport"
        tabIndex={0}
        role="region"
        aria-label="Interactive Throwable Sleeve Deck. Use arrow keys or drag horizontally to flip sleeves."
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
      >
        {deckIndices.map((sleeveIdx, stackPosition) => {
          const sleeve = SLEEVES[sleeveIdx];
          const isTop = stackPosition === 0;

          // Resting stack offsets
          const restingScale = 1 - stackPosition * 0.04;
          const restingTranslateY = stackPosition * 10;
          const restingTranslateX = (stackPosition % 2 === 1 ? 1 : -1) * (stackPosition * 7);
          const restingRotate = (stackPosition % 2 === 1 ? -1 : 1) * (stackPosition * 1.8);
          const zIndex = 10 - stackPosition;

          let transform = `translate3d(${restingTranslateX}px, ${restingTranslateY}px, 0) scale(${restingScale}) rotate(${restingRotate}deg)`;
          let transition = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease';

          if (isTop) {
            if (isDragging) {
              // Direct drag tracking with rotation proportional to drag and very slight scale up
              const rotation = dragOffset.x * 0.07;
              transform = `translate3d(${dragOffset.x}px, ${dragOffset.y * 0.3}px, 0) scale(1.02) rotate(${rotation}deg)`;
              transition = 'none'; // instant tracking
            } else if (tossingState) {
              // Throw card out across deck width with small lift and roll in direction of travel
              const tossX = tossingState.direction === 'right' ? '125%' : '-125%';
              const tossRotate = tossingState.direction === 'right' ? 24 : -24;
              transform = `translate3d(${tossX}, -28px, 0) scale(1.04) rotate(${tossRotate}deg)`;
              transition = 'transform 0.28s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.28s ease';
            }
          }

          return (
            <div
              key={sleeve.id}
              className={`deck-card ${isTop && isDragging ? 'is-dragging' : ''}`}
              style={{
                transform,
                transition,
                zIndex,
                pointerEvents: isTop ? 'auto' : 'none',
                opacity: stackPosition > 3 ? 0 : 1 - stackPosition * 0.12
              }}
            >
              <div className="card-header">
                <span className="card-code">{sleeve.code}</span>
                <span className="card-tag">{sleeve.tag}</span>
              </div>

              <div className="card-body">
                <h3 className="card-title">{sleeve.title}</h3>
                <p className="card-desc">{sleeve.desc}</p>

                <div className="card-tech-metric">
                  <div className="metric-item">
                    <span className="metric-label">{sleeve.metric1Label}</span>
                    <span className="metric-val">{sleeve.metric1Val}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">{sleeve.metric2Label}</span>
                    <span className="metric-val">{sleeve.metric2Val}</span>
                  </div>
                </div>
              </div>

              <div className="card-footer">
                <div className="card-status">
                  <span className="meta-accent-dot" />
                  <span>{sleeve.status}</span>
                </div>
                <span className="metric-label font-mono">0{sleeveIdx + 1} / 05</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Dots and Hint Line */}
      <div className="deck-controls">
        <div className="deck-dots">
          {SLEEVES.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`deck-dot ${i === topSleeveIndex ? 'active' : ''}`}
              onClick={() => {
                // Bring selected sleeve to top
                setDeckIndices((prev) => {
                  const filtered = prev.filter((idx) => idx !== i);
                  return [i, ...filtered];
                });
              }}
              aria-label={`Show sleeve ${i + 1}`}
            />
          ))}
        </div>

        <div className="deck-hint">
          <span>TOSS CARD ASIDE OR PRESS ← → KEYS</span>
        </div>
      </div>
    </div>
  );
};
