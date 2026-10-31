import React from 'react';

interface NavbarProps {
  currentPage: 'home' | 'dashboard' | 'denoiser';
  onNavigate: (page: 'home' | 'dashboard' | 'denoiser') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  return (
    <header className="site-nav" role="banner">
      <div className="nav-container-corners">
        {/* Corner Left: Website Name */}
        <div className="nav-left-brand">
          <button 
            type="button" 
            onClick={() => onNavigate('home')} 
            className="nav-brand-kinetic"
            aria-label="NEUROSYNC Home"
          >
            <span className="brand-wordmark">NEUROSYNC</span>
            <span className="brand-dot">.</span>
          </button>
        </div>

        {/* Center-Aligned: HOME, DASHBOARD, and MODEL EEG with Kinetic Font Move Animation */}
        <nav className="nav-center-group" aria-label="Main Navigation">
          <button
            type="button"
            className={`nav-kinetic-btn ${currentPage === 'home' ? 'active' : ''}`}
            onClick={() => onNavigate('home')}
            aria-current={currentPage === 'home' ? 'page' : undefined}
          >
            <span className="font-roll-wrap">
              <span className="font-roll-item primary">HOME</span>
              <span className="font-roll-item secondary">HOME</span>
            </span>
          </button>

          <span className="nav-center-divider" aria-hidden="true">•</span>

          <button
            type="button"
            className={`nav-kinetic-btn ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={() => onNavigate('dashboard')}
            aria-current={currentPage === 'dashboard' ? 'page' : undefined}
          >
            <span className="font-roll-wrap">
              <span className="font-roll-item primary">DASHBOARD</span>
              <span className="font-roll-item secondary">DASHBOARD</span>
            </span>
          </button>

          <span className="nav-center-divider" aria-hidden="true">•</span>

          <button
            type="button"
            className={`nav-kinetic-btn ${currentPage === 'denoiser' ? 'active' : ''}`}
            onClick={() => onNavigate('denoiser')}
            aria-current={currentPage === 'denoiser' ? 'page' : undefined}
          >
            <span className="font-roll-wrap">
              <span className="font-roll-item primary">MODEL EEG</span>
              <span className="font-roll-item secondary">MODEL EEG</span>
            </span>
          </button>
        </nav>
      </div>
    </header>
  );
};
