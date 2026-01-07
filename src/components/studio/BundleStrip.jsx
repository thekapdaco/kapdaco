import React from 'react';
import { KCButton } from '../ui';

const BundleStrip = () => (
  <section className="kc-container mt-12 rounded-[var(--kc-radius-lg)] border border-[var(--kc-gold-1)]/30 bg-[rgba(211,167,95,0.08)] p-8 text-sm text-[var(--kc-ink)] shadow-[var(--kc-shadow-md)]">
    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
      <div className="space-y-2 text-[var(--kc-ink)]">
        <p className="kc-pill inline-flex bg-white/40 text-[var(--kc-ink)]">Bundle & Save</p>
        <h3 className="text-2xl font-semibold">Complete the look and save 15%</h3>
        <p className="text-[var(--kc-ink-2)]">
          Pair your custom tee with a tote and cap crafted in the same palette. Automatic savings applied at checkout.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        {["Premium Tee", "Canvas Tote", "Snapback Cap"].map((item) => (
          <div key={item} className="rounded-[var(--kc-radius)] border border-[var(--kc-ink)]/10 bg-white/60 px-4 py-2 text-sm font-semibold">
            {item}
          </div>
        ))}
        <KCButton className="px-6">
          Add bundle
        </KCButton>
      </div>
    </div>
  </section>
);

export default BundleStrip;
