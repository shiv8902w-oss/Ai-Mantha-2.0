import React from 'react';
import { ThrowableDeck } from './ThrowableDeck';

interface ReleasesSectionProps {
  onExploreArchitecture: () => void;
  onLaunchVirtualInterface: () => void;
}

export const ReleasesSection: React.FC<ReleasesSectionProps> = ({
  onExploreArchitecture,
  onLaunchVirtualInterface
}) => {
  return (
    <section id="releases" className="releases-section" aria-label="Neural Pipeline Sleeves">
      <div className="releases-container">
        <div className="releases-two-col">
          {/* Left Column: Headline, Lede, Two Buttons */}
          <div className="releases-info">
            <div className="releases-meta">
              <span className="meta-accent-dot" />
              <span className="label-caps">[02] PIPELINE SPECIFICATION</span>
            </div>

            <h2 className="releases-headline">
              NEURAL PIPELINE &amp; SLEEVES
            </h2>

            <p className="releases-lede">
              The processing core is built as a chain of five specialized neuro-modules. 
              Starting from raw 128Hz multi-channel microvolt signals over the primary motor cortex 
              (C3, Cz, C4), each stage isolates frequency bands, suppresses artifacts, projects 
              spatial variance, and executes neural inference under 18 milliseconds. Flip through 
              the physical sleeve deck to inspect each stage of the pipeline.
            </p>

            <div className="releases-actions">
              <button
                type="button"
                className="btn-primary-outline"
                onClick={onLaunchVirtualInterface}
              >
                <span className="meta-accent-dot" />
                LAUNCH VIRTUAL INTERFACE
              </button>
              
              <button
                type="button"
                className="btn-ghost"
                onClick={onExploreArchitecture}
              >
                VIEW ARCHITECTURE ROSTER →
              </button>
            </div>
          </div>

          {/* Right Column: Physical Throwable Sleeve Deck */}
          <ThrowableDeck />
        </div>
      </div>
    </section>
  );
};
