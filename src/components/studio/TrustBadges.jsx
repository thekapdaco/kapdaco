import React from 'react';
import { Leaf, Recycle, ShieldCheck } from 'lucide-react';

const badges = [
  {
    icon: ShieldCheck,
    title: 'Ethical production',
    description: 'Certified workshops with living wages and modern compliance checks.',
  },
  {
    icon: Leaf,
    title: 'Low-impact dyes',
    description: 'Water-based inks and OEKO-TEX® dyes reduce environmental footprint.',
  },
  {
    icon: Recycle,
    title: 'Circular packaging',
    description: 'Recyclable mailers and carbon-neutral shipping on every order.',
  },
];

const TrustBadges = () => (
  <section className="kc-container mt-16 space-y-6 text-white">
    <div className="space-y-2 text-center">
      <p className="kc-pill mx-auto bg-white/10 text-white/70">Sustainability & Quality</p>
      <h2 className="text-2xl font-semibold">Crafted responsibly, delivered with care</h2>
      <p className="text-sm text-white/60">
        Every Kapda Co. piece is made-to-order to minimise waste while maintaining atelier-grade finishing.
      </p>
    </div>

    <div className="grid gap-6 md:grid-cols-3">
      {badges.map((badge) => (
        <div
          key={badge.title}
          className="space-y-3 rounded-[var(--kc-radius-lg)] border border-[var(--kc-gold-1)]/30 bg-white/5 p-6 text-sm shadow-[var(--kc-shadow-sm)]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--kc-gold-1)]/40 bg-[rgba(211,167,95,0.14)] text-[var(--kc-gold-1)]">
            <badge.icon size={20} />
          </div>
          <h3 className="text-lg font-semibold text-white">{badge.title}</h3>
          <p className="text-white/70">{badge.description}</p>
        </div>
      ))}
    </div>
  </section>
);

export default TrustBadges;
