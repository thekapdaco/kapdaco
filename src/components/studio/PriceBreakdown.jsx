import React from 'react';
import { Info } from 'lucide-react';

const PriceBreakdown = ({ rows, total }) => (
  <aside className="sticky top-28 space-y-4 rounded-[var(--kc-radius-lg)] border border-[var(--kc-gold-1)]/40 bg-white/5 p-6 text-sm text-white shadow-[var(--kc-shadow-md)]">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--kc-gold-2)]">Pricing details</p>
        <h3 className="mt-2 text-xl font-semibold text-white">Your investment</h3>
      </div>
      <Info size={18} className="text-[var(--kc-gold-1)]" aria-hidden="true" />
    </div>

    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between text-white/80">
          <span>{row.label}</span>
          <span className="font-medium text-white">₹{row.value.toLocaleString()}</span>
        </div>
      ))}
    </div>

    <div className="flex items-center justify-between border-t border-white/10 pt-3 text-white">
      <span className="text-sm font-semibold uppercase tracking-[0.32em] text-white/70">Total</span>
      <span className="text-2xl font-semibold">₹{total.toLocaleString()}</span>
    </div>

    <p className="text-xs text-white/50">
      Taxes calculated based on shipping address. Production and dispatch timelines update once you confirm sizes and finishes.
    </p>
  </aside>
);

export default PriceBreakdown;
