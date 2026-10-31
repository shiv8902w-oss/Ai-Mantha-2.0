import React, { useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { PortalHero } from './components/PortalHero';
import { StatementFold } from './components/StatementFold';
import { ReleasesSection } from './components/ReleasesSection';
import { BciVirtualInterface } from './components/BciVirtualInterface';
import { RosterSection } from './components/RosterSection';
import { DatesTableSection } from './components/DatesTableSection';
import { CloseSection } from './components/CloseSection';

export const App: React.FC = () => {
  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return (
    <div className="site-wrapper">
      <Navbar 
        onScrollToSection={scrollToSection}
        onActivateBci={() => scrollToSection('bci-lab')}
      />

      <main>
        {/* Section 1: The Signature Portal Hero (2.5 viewports, sticky stage, parting panels, split wordmark) */}
        <PortalHero />

        {/* Section 2: Statement Fold (Full height, outlined index 01, clamp statement with accent, floating disc) */}
        <StatementFold />

        {/* Section 3: Releases & Pipeline Sleeves (Two columns, physical throwable card deck) */}
        <ReleasesSection
          onExploreArchitecture={() => scrollToSection('roster')}
          onLaunchVirtualInterface={() => scrollToSection('bci-lab')}
        />

        {/* Section 4: Interactive BCI Virtual Interface Prototype (Problem Statement 3 Core Demo) */}
        <BciVirtualInterface />

        {/* Section 5: Roster (Hairline-ruled rows, display-face names, right-aligned metrics) */}
        <RosterSection />

        {/* Section 6: Validation Dates & Benchmark Matrix Table (Collapsible on mobile) */}
        <DatesTableSection />
      </main>

      {/* Section 7: Close (Headline, fine-print, buttons, hairline footer strip, cropped wordmark) */}
      <CloseSection />
    </div>
  );
};

export default App;
