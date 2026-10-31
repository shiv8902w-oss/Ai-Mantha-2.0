import React, { useEffect, useRef, useState } from 'react';

export const PortalHero: React.FC = () => {
  const heroRef = useRef<HTMLElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    // Check prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setScrollProgress(1); // Set to fully open for reduced motion
      return;
    }

    const handleScroll = () => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      const heroTop = rect.top;
      const heroHeight = rect.height;
      const windowHeight = window.innerHeight;

      // The hero is 250vh, so scrollable distance is heroHeight - windowHeight
      const totalScrollable = heroHeight - windowHeight;
      if (totalScrollable <= 0) return;

      // When heroTop is 0, progress is 0.
      // When heroTop reaches -(heroHeight - windowHeight), progress is 1.
      const currentScroll = -heroTop;
      const progress = Math.min(1, Math.max(0, currentScroll / totalScrollable));
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  // Compute transform styles dynamically based on scroll progress
  // Panels translate outward past their width (>100%)
  const leftPanelTransform = `translateX(-${scrollProgress * 105}%)`;
  const rightPanelTransform = `translateX(${scrollProgress * 105}%)`;

  // Image settles from overscale (1.18) down to 1.0
  const imageScale = 1.18 - scrollProgress * 0.18;

  // Duotone wash rises from 0 to 0.28 opacity
  const duotoneOpacity = scrollProgress * 0.28;

  // Wordmark signature move:
  // Title scales UP (from 1.0 to 1.35) while letter-spacing simultaneously TIGHTENS
  const titleScale = 1.0 + scrollProgress * 0.35;
  const letterSpacing = 0.02 - scrollProgress * 0.06; // from 0.02em to -0.04em
  const leftSpanTransform = `translateX(-${scrollProgress * 52}%)`;
  const rightSpanTransform = `translateX(${scrollProgress * 52}%)`;

  // Accent dots travel out toward opposite corners of the field
  const dot1X = 50 - scrollProgress * 38; // 50% -> 12%
  const dot1Y = 50 - scrollProgress * 32; // 50% -> 18%

  const dot2X = 50 + scrollProgress * 38; // 50% -> 88%
  const dot2Y = 50 + scrollProgress * 32; // 50% -> 82%

  return (
    <section ref={heroRef} id="hero" className="portal-hero-section" aria-label="Portal Hero">
      <div className="portal-stage">
        {/* Layer 1: Full-bleed image starting overscaled */}
        <img
          src="/assets/hero-bci.jpg"
          alt="Neural EEG Brain-Computer Interface Laboratory"
          className="portal-bg-media"
          style={{ transform: `scale(${imageScale})` }}
        />

        {/* Layer 2: Duotone wash blending two accents at mix-blend-mode overlay */}
        <div 
          className="portal-duotone-wash" 
          style={{ opacity: duotoneOpacity }}
          aria-hidden="true"
        />

        {/* Layer 3: Radial veil darkening edges */}
        <div className="portal-radial-veil" aria-hidden="true" />

        {/* Layer 4: TWO solid panels meeting in the middle, parting outward */}
        <div 
          className="portal-panel left-panel"
          style={{ transform: leftPanelTransform }}
          aria-hidden="true"
        />
        <div 
          className="portal-panel right-panel"
          style={{ transform: rightPanelTransform }}
          aria-hidden="true"
        />

        {/* Layer 5: Two glowing accent dots traveling to opposite corners */}
        <div
          className="portal-dot"
          style={{
            left: `${dot1X}%`,
            top: `${dot1Y}%`,
            opacity: Math.max(0.2, 1 - scrollProgress * 0.3)
          }}
          aria-hidden="true"
        />
        <div
          className="portal-dot-secondary"
          style={{
            left: `${dot2X}%`,
            top: `${dot2Y}%`,
            opacity: Math.max(0.2, 1 - scrollProgress * 0.3)
          }}
          aria-hidden="true"
        />

        {/* Layer 6: Wordmark on top, split into two spans */}
        <div className="portal-title-wrapper">
          <h1 
            className="portal-title"
            style={{
              transform: `scale(${titleScale})`,
              letterSpacing: `${letterSpacing}em`
            }}
          >
            <span 
              className="portal-word-left"
              style={{ transform: leftSpanTransform }}
            >
              NEURO
            </span>
            <span 
              className="portal-word-right"
              style={{ transform: rightSpanTransform }}
            >
              SYNAPSE
            </span>
          </h1>
        </div>

        {/* Layer 7: Corner metadata pinned to top and bottom edges */}
        <div className="portal-corner-meta top-left">
          <span className="meta-accent-dot" />
          <span>AI MANTHAN 2.0 // PS-03</span>
        </div>

        <div className="portal-corner-meta top-right">
          <span>MOTOR IMAGERY BCI v2.4</span>
        </div>

        <div className="portal-corner-meta bottom-left">
          <span>10-20 SENSORIMOTOR ARRAY // 128Hz</span>
        </div>

        <div className="portal-corner-meta bottom-right">
          <span className="meta-accent-dot" />
          <span>LATENCY &lt; 18ms // 96.4% ACC</span>
        </div>
      </div>
    </section>
  );
};
