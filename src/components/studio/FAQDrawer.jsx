import React from 'react';

const FAQDrawer = () => (
  <div className="grid gap-4 text-sm text-white/80">
    {[
      {
        q: 'Which file formats work best?',
        a: 'High-resolution PNG or transparent SVG ensures the sharpest print. Keep files under 10MB.',
      },
      {
        q: 'Can I reorder the design layers?',
        a: 'Use the Layers tab to drag, lock, duplicate and rename your artwork or typography layers.',
      },
      {
        q: 'How are colours calibrated?',
        a: 'We run soft-proofing against Pantone TCX references and use water-based inks tuned for cotton blends.',
      },
      {
        q: 'What happens after I place the order?',
        a: 'Our studio double-checks alignment, prints within 48 hours, and ships with tracking from our Delhi facility.',
      },
    ].map((item) => (
      <div key={item.q} className="rounded-[var(--kc-radius)] border border-white/10 bg-white/5 px-4 py-3">
        <p className="text-sm font-semibold text-white">{item.q}</p>
        <p className="mt-1 text-xs text-white/70">{item.a}</p>
      </div>
    ))}
  </div>
);

export default FAQDrawer;
