import React from 'react';
import { KCButton, KCCard } from '../../components/ui';

const buttonStates = [
  { label: 'Default', state: 'default', description: 'Resting elevation' },
  { label: 'Hover / Pressed', state: 'hover', description: 'Lift + glow' },
  { label: 'Disabled', state: 'disabled', description: 'Muted cream' },
];

const PremiumThemeShowcase = () => {
  return (
    <main className="premium-ui">
      <section className="premium-panel">
        <h3>Desktop Card Grid</h3>
        <p className="premium-note">
          Each product card sits on a glass surface with cream gradients behind imagery.
          Buttons illustrate their hover and disabled states in context.
        </p>
        <div className="premium-grid">
          {[1, 2, 3].map((index) => (
            <KCCard key={index} className="premium-product-card">
              <div className="premium-product-card__media">Look {index}</div>
              <div className="premium-card-meta">
                <span>Monsoon Capsule</span>
                <span>₹{(14800 + index * 1200).toLocaleString('en-IN')}</span>
              </div>
              <div className="premium-btn-group">
                <KCButton data-state="default">Add to Bag</KCButton>
                <KCButton variant="secondary" data-state="hover">
                  Quick View
                </KCButton>
                <KCButton variant="ghost">Designer Notes</KCButton>
              </div>
            </KCCard>
          ))}
        </div>
      </section>

      <section className="premium-panel">
        <h3>Button States</h3>
        <div className="button-state-grid">
          {buttonStates.map(({ label, state, description }) => (
            <div key={state} className="button-state-card">
              <span className="state-label">{label}</span>
              <div className="premium-btn-group">
                <div className="cta-action">
                  <KCButton data-state={state} disabled={state === 'disabled'}>
                    Primary CTA
                  </KCButton>
                  <span className="contrast-pill">4.9:1 contrast</span>
                </div>
                <div className="cta-action">
                  <KCButton
                    variant="secondary"
                    data-state={state}
                    disabled={state === 'disabled'}
                  >
                    Secondary glass
                  </KCButton>
                  <span className="contrast-pill">6.3:1 contrast</span>
                </div>
                <div className="cta-action">
                  <KCButton
                    variant="ghost"
                    data-state={state}
                    disabled={state === 'disabled'}
                  >
                    Ghost action
                  </KCButton>
                  <span className="contrast-pill">8.1:1 contrast</span>
                </div>
              </div>
              <p className="premium-note">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="premium-panel">
        <h3>Single PDP Sticky CTA</h3>
        <div className="cta-bar" data-device="desktop">
          <div className="cta-text-group">
            <span className="state-label">Investment</span>
            <strong className="text-2xl text-[var(--kc-navy)]">₹18,400</strong>
          </div>
          <div className="cta-actions">
            <KCButton data-state="hover">Add to Bag</KCButton>
            <KCButton variant="secondary">Schedule Atelier Call</KCButton>
            <KCButton variant="ghost">Size Guide</KCButton>
          </div>
        </div>
      </section>

      <section className="premium-panel">
        <h3>Mobile Footer CTAs</h3>
        <div className="cta-bar" data-device="mobile">
          <div className="cta-text-group">
            <span className="state-label">Monsoon Trench</span>
            <strong className="text-xl text-[var(--kc-navy)]">₹22,900</strong>
          </div>
          <div className="mobile-actions">
            <KCButton data-state="hover">Buy Now</KCButton>
            <KCButton variant="secondary" data-state="hover">
              Atelier Chat
            </KCButton>
            <KCButton variant="ghost">Wishlist</KCButton>
            <KCButton variant="ghost" data-state="disabled" disabled>
              Coming Soon
            </KCButton>
          </div>
        </div>
      </section>
    </main>
  );
};

export default PremiumThemeShowcase;

