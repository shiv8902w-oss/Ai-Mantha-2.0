import React, { useState, useRef, useCallback, useEffect } from 'react';

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
  const [enteringState, setEnteringState] = useState<{ direction: 'left' | 'right' } | null>(null);
  const [hoveredCardIdx, setHoveredCardIdx] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  const deckRef = useRef<HTMLDivElement>(null);
  const startPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Handle responsive layout detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Function to execute a forward throw / slide
  const executeThrow = useCallback((direction: 'left' | 'right' = 'left') => {
    if (tossingState) return;
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
  }, [tossingState]);

  // Function to execute previous slide
  const executePrev = useCallback(() => {
    if (tossingState || isDragging) return;
    setEnteringState({ direction: 'left' });

    setDeckIndices((prev) => {
      const next = [...prev];
      const bottom = next.pop();
      if (bottom !== undefined) {
        next.unshift(bottom);
      }
      return next;
    });

    setTimeout(() => {
      setEnteringState(null);
    }, 280);
  }, [tossingState, isDragging]);

  // Jump smoothly to a specific sleeve index with sliding animation
  const handleSelectSleeve = useCallback((targetIndex: number) => {
    if (tossingState || isDragging) return;
    if (deckIndices[0] === targetIndex) return;

    setTossingState({ direction: 'left' });
    setTimeout(() => {
      setDeckIndices((prev) => {
        const rest = prev.filter((idx) => idx !== targetIndex);
        return [targetIndex, ...rest];
      });
      setTossingState(null);
      setDragOffset({ x: 0, y: 0 });
      setIsDragging(false);
    }, 220);
  }, [deckIndices, tossingState, isDragging]);

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
    const threshold = Math.max(40, deckWidth * 0.1);

    if (Math.abs(dragOffset.x) > threshold) {
      const direction = dragOffset.x > 0 ? 'right' : 'left';
      executeThrow(direction);
    } else {
      // Spring back
      setDragOffset({ x: 0, y: 0 });
      setIsDragging(false);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (tossingState) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      executeThrow('left');
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      executePrev();
    }
  };

  // Active top sleeve index
  const topSleeveIndex = deckIndices[0];

  return (
    <div className="deck-col">
      {/* 3D Tilted Deck Stage: cards arranged in tilted form so below cards can be read */}
      <div className="deck-stage-wrapper">
        <div
          ref={deckRef}
          className="deck-viewport"
          tabIndex={0}
          role="region"
          aria-label="Interactive 3D Tilted Neural Pipeline Deck. Swipe horizontally, click cards below, or use arrow keys."
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onKeyDown={handleKeyDown}
        >
          {deckIndices.map((sleeveIdx, stackPosition) => {
            const sleeve = SLEEVES[sleeveIdx];
            const isTop = stackPosition === 0;
            const isHovered = hoveredCardIdx === sleeveIdx && !isTop;
            const zIndex = 12 - stackPosition;

            // Geometry settings for tilted cascade
            const stepX = isMobile ? 12 : 22;
            const stepY = isMobile ? 24 : 34;
            const stepZ = isMobile ? 26 : 38;

            // Base coordinates
            const restingScale = 1 - stackPosition * (isMobile ? 0.025 : 0.035);
            const restingTranslateX = stackPosition * stepX;
            const baseTranslateY = 32 - stackPosition * stepY;
            const restingTranslateY = isHovered ? baseTranslateY - 18 : baseTranslateY;
            const baseTranslateZ = -stackPosition * stepZ;
            const restingTranslateZ = isHovered ? baseTranslateZ + 45 : baseTranslateZ;

            // 3D Tilt angles
            const restingRotateX = 5 + stackPosition * 1.5;
            const restingRotateY = -7 + stackPosition * 1.8;
            const restingRotateZ = -1.5 + stackPosition * 2.2;

            let transform = `translate3d(${restingTranslateX}px, ${restingTranslateY}px, ${restingTranslateZ}px) scale(${isHovered ? restingScale + 0.02 : restingScale}) rotateX(${restingRotateX}deg) rotateY(${restingRotateY}deg) rotateZ(${restingRotateZ}deg)`;
            let transition = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease, border-color 0.25s ease, box-shadow 0.25s ease';
            let opacity = 1;

            if (isTop) {
              if (isDragging) {
                const rotation = dragOffset.x * 0.07;
                transform = `translate3d(${dragOffset.x}px, ${32 + dragOffset.y * 0.25}px, 40px) scale(1.03) rotate(${rotation}deg)`;
                transition = 'none';
              } else if (tossingState) {
                const tossX = tossingState.direction === 'right' ? '140%' : '-140%';
                const tossRotate = tossingState.direction === 'right' ? 24 : -24;
                transform = `translate3d(${tossX}, -20px, 60px) scale(1.05) rotate(${tossRotate}deg)`;
                transition = 'transform 0.28s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.28s ease';
                opacity = 0;
              } else if (enteringState) {
                // Smooth glide in when entering from previous action
                transform = `translate3d(0px, 32px, 0px) scale(1) rotateX(5deg) rotateY(-7deg) rotateZ(-1.5deg)`;
                transition = 'transform 0.32s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease';
              }
            }

            return (
              <div
                key={sleeve.id}
                className={`deck-card ${isTop ? 'is-top' : 'is-below'} ${isTop && isDragging ? 'is-dragging' : ''} ${isHovered ? 'is-hovered' : ''}`}
                style={{
                  transform,
                  transition,
                  zIndex,
                  opacity
                }}
                onClick={() => {
                  if (!isTop) {
                    handleSelectSleeve(sleeveIdx);
                  }
                }}
                onPointerEnter={() => {
                  if (!isTop) setHoveredCardIdx(sleeveIdx);
                }}
                onPointerLeave={() => {
                  if (!isTop) setHoveredCardIdx(null);
                }}
              >
                {/* Header: Designed so below cards have their option and title clearly readable */}
                <div className="card-header">
                  <div className="card-header-left">
                    <span className="card-code">{sleeve.code}</span>
                    {!isTop && (
                      <span className="card-peek-title">{sleeve.title}</span>
                    )}
                  </div>
                  <div className="card-header-right">
                    <span className="card-tag">{sleeve.tag}</span>
                    {!isTop && (
                      <span className="card-peek-badge">SLIDE →</span>
                    )}
                  </div>
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
      </div>

      {/* Navigation Controls: Prev / Dots / Next with Sliding Animation */}
      <div className="deck-controls">
        <div className="deck-nav-row">
          <button
            type="button"
            className="deck-arrow-btn"
            onClick={executePrev}
            aria-label="Previous sleeve"
          >
            ← PREV
          </button>

          <div className="deck-dots">
            {SLEEVES.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`deck-dot ${i === topSleeveIndex ? 'active' : ''}`}
                onClick={() => handleSelectSleeve(i)}
                aria-label={`Show sleeve ${i + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            className="deck-arrow-btn"
            onClick={() => executeThrow('left')}
            aria-label="Next sleeve"
          >
            NEXT →
          </button>
        </div>

        <div className="deck-hint">
          <span className="deck-hint-kbd">← →</span>
          <span>SWIPE TO SLIDE • CLICK CARDS BEHIND TO READ</span>
        </div>
      </div>
    </div>
  );
};
