import React, { useState, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { PortalHero } from './components/PortalHero';
import { StatementFold } from './components/StatementFold';
import { ReleasesSection } from './components/ReleasesSection';
import { BciVirtualInterface } from './components/BciVirtualInterface';
import { RosterSection } from './components/RosterSection';
import { DatesTableSection } from './components/DatesTableSection';
import { CloseSection } from './components/CloseSection';
import { DashboardPage } from './components/DashboardPage';
import { EegDenoiserPage } from './components/EegDenoiserPage';
import { FluidCursor } from './components/FluidCursor';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'home' | 'dashboard' | 'denoiser'>('home');

  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const handleNavigate = useCallback((page: 'home' | 'dashboard' | 'denoiser') => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleOpenVirtualInterfaceFromDashboard = useCallback(() => {
    setCurrentPage('home');
    setTimeout(() => {
      scrollToSection('bci-lab');
    }, 120);
  }, [scrollToSection]);

  return (
    <div className="site-wrapper">
      {/* High-Performance Fluid Mouse Cursor */}
      <FluidCursor />

      {/* Clean Navbar with Home, Dashboard, and Model EEG */}
      <Navbar 
        currentPage={currentPage}
        onNavigate={handleNavigate}
      />

      {currentPage === 'home' && (
        <main>
          {/* Section 1: The Signature Portal Hero (2.5 viewports, sticky stage, parting panels, split wordmark) */}
          <PortalHero />

          {/* Section 2: Statement Fold (Full height, outlined index 01, clamp statement with accent, floating disc) */}
          <StatementFold />

          {/* Section 3: Releases & Pipeline Sleeves (Two columns, physical throwable card deck) */}
          <ReleasesSection
            onExploreArchitecture={() => scrollToSection('roster')}
            onLaunchVirtualInterface={() => scrollToSection('bci-lab')}
            onOpenDenoiser={() => handleNavigate('denoiser')}
          />

          {/* Section 4: Interactive BCI Virtual Interface Prototype (Problem Statement 3 Core Demo) */}
          <BciVirtualInterface />

          {/* Section 5: Roster (Hairline-ruled rows, display-face names, right-aligned metrics) */}
          <RosterSection />

          {/* Section 6: Validation Dates & Benchmark Matrix Table (Collapsible on mobile) */}
          <DatesTableSection />

          {/* Section 7: Close (Headline, fine-print, buttons, hairline footer strip, cropped wordmark) */}
          <CloseSection />
        </main>
      )}

      {currentPage === 'dashboard' && (
        <main>
          {/* Dashboard Page */}
          <DashboardPage
            onReturnHome={() => handleNavigate('home')}
            onOpenVirtualInterface={handleOpenVirtualInterfaceFromDashboard}
          />
        </main>
      )}

      {currentPage === 'denoiser' && (
        <main>
          {/* Model EEG / Artifact Denoiser Page */}
          <EegDenoiserPage
            onReturnHome={() => handleNavigate('home')}
            onOpenDashboard={() => handleNavigate('dashboard')}
          />
        </main>
      )}
    </div>
  );
};

export default App;
