import React from 'react';

interface NavbarProps {
  onScrollToSection: (sectionId: string) => void;
  onActivateBci: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onScrollToSection, onActivateBci }) => {
  return (
    <header className="site-nav" role="banner">
      <div className="nav-container">
        <div className="nav-brand">
          <a 
            href="#hero" 
            onClick={(e) => {
              e.preventDefault();
              onScrollToSection('hero');
            }}
            className="nav-wordmark"
            aria-label="NEUROSYNC Home"
          >
            NEUROSYNC<span className="nav-period">.</span>
          </a>
        </div>

        <nav className="nav-links" aria-label="Primary Navigation">
          <li className="nav-link-item">
            <a 
              href="#statement"
              onClick={(e) => {
                e.preventDefault();
                onScrollToSection('statement');
              }}
            >
              [01] PARADIGM
            </a>
          </li>
          <li className="nav-link-item">
            <a 
              href="#releases"
              onClick={(e) => {
                e.preventDefault();
                onScrollToSection('releases');
              }}
            >
              [02] PIPELINE SLEEVES
            </a>
          </li>
          <li className="nav-link-item">
            <a 
              href="#bci-lab"
              onClick={(e) => {
                e.preventDefault();
                onScrollToSection('bci-lab');
              }}
            >
              [03] VIRTUAL INTERFACE
            </a>
          </li>
          <li className="nav-link-item">
            <a 
              href="#roster"
              onClick={(e) => {
                e.preventDefault();
                onScrollToSection('roster');
              }}
            >
              [04] ROSTER
            </a>
          </li>
          <li className="nav-link-item">
            <a 
              href="#dates"
              onClick={(e) => {
                e.preventDefault();
                onScrollToSection('dates');
              }}
            >
              [05] BENCHMARKS
            </a>
          </li>
        </nav>

        <div>
          <button 
            type="button" 
            className="nav-pill-btn"
            onClick={onActivateBci}
            aria-label="Activate Live BCI Interface"
          >
            <span className="nav-pill-dot" />
            LIVE BCI PROTO
          </button>
        </div>
      </div>
    </header>
  );
};
