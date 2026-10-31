import React, { useEffect, useRef, useState } from 'react';

export const StatementFold: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [discTransform, setDiscTransform] = useState({ y: 0, rotate: 0 });

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Calculate relative position within viewport
      const relativeY = rect.top - windowHeight / 2;
      const driftY = relativeY * -0.14;
      const rotation = relativeY * 0.06;

      setDiscTransform({ y: driftY, rotate: rotation });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section ref={sectionRef} id="statement" className="statement-section" aria-label="Statement Fold">
      <div className="statement-container">
        <div className="statement-grid">
          <div className="statement-top-meta">
            <span className="meta-accent-dot" />
            <span className="label-caps">[01] PROBLEM FORMULATION &amp; PARADIGM</span>
          </div>

          <div className="statement-index-outline" aria-hidden="true">
            01
          </div>

          <p className="statement-body">
            Decoding user intent through non-invasive EEG, translating sensorimotor rhythms into{' '}
            <span className="accent-phrase">low-latency virtual assistive autonomy</span>.
          </p>

          <p className="statement-subtext">
            Standard non-invasive EEG channels capture raw cortical activity that is heavily corrupted by 
            ocular blinks, muscular artifacts, and ambient electromagnetic interference. We engineer an 
            end-to-end AI pipeline integrating zero-phase Butterworth filtering (8–30 Hz μ/β), FastICA 
            denoising, Common Spatial Patterns (r-CSP), and a compact 2,480-parameter EEGNet to decode 
            contralateral motor imagery with sub-18ms latency.
          </p>
        </div>
      </div>

      {/* Circular image floating off right edge that drifts and rotates on scroll */}
      <div
        className="statement-floating-disc"
        style={{
          transform: `translateY(${discTransform.y}px) rotate(${discTransform.rotate}deg)`
        }}
        aria-hidden="true"
      >
        <img
          src="/assets/topography-disc.jpg"
          alt="10-20 EEG Electrode Montage Topographical Projection"
        />
      </div>
    </section>
  );
};
