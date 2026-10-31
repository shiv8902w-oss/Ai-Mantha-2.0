import React, { useEffect, useRef, useState } from 'react';

export const FluidCursor: React.FC = () => {
  const cursorFollowerRef = useRef<HTMLDivElement>(null);

  const mousePos = useRef<{ x: number; y: number }>({ x: -100, y: -100 });
  const cursorFollow = useRef<{ x: number; y: number }>({ x: -100, y: -100 });
  const hasInitialized = useRef<boolean>(false);

  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isClicking, setIsClicking] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    // Only enable on fine pointer devices (mouse / trackpad)
    if (window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    const updateHoverState = (target: HTMLElement | null) => {
      if (target) {
        const interactive = target.closest(
          'a, button, input, textarea, select, [role="button"], .deck-card, .speller-cell, .arena-target, .stim-btn, .toggle-chip, .electrode-node-group, [tabindex]:not([tabindex="-1"])'
        );
        setIsHovered(!!interactive);
      } else {
        setIsHovered(false);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!hasInitialized.current) {
        hasInitialized.current = true;
        cursorFollow.current = { x: e.clientX, y: e.clientY };
        setIsVisible(true);
      }
      mousePos.current = { x: e.clientX, y: e.clientY };
      updateHoverState(e.target as HTMLElement | null);
    };

    const handleMouseDown = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      setIsClicking(true);
    };

    const handleMouseUp = () => {
      setIsClicking(false);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      cursorFollow.current = { x: e.clientX, y: e.clientY };
      setIsVisible(true);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown, { passive: true });
    window.addEventListener('mouseup', handleMouseUp, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    let animationFrameId: number;

    const animate = () => {
      // Fluid lerp tracking
      const ease = 0.22;
      const dx = mousePos.current.x - cursorFollow.current.x;
      const dy = mousePos.current.y - cursorFollow.current.y;

      cursorFollow.current.x += dx * ease;
      cursorFollow.current.y += dy * ease;

      if (cursorFollowerRef.current) {
        cursorFollowerRef.current.style.transform = `translate3d(${cursorFollow.current.x}px, ${cursorFollow.current.y}px, 0)`;
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className={`contrast-cursor-host ${isVisible ? 'visible' : ''}`} aria-hidden="true">
      {/* Outer Follower receives translate3d lerp position */}
      <div ref={cursorFollowerRef} className="contrast-cursor-follower">
        {/* Inner Disc handles scale down on click and hover expansion */}
        <div
          className={`single-white-contrast-cursor ${isHovered ? 'hovered' : ''} ${isClicking ? 'clicking' : ''}`}
        />
      </div>
    </div>
  );
};
