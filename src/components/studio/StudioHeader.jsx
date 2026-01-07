import React from 'react';
import { ArrowLeft, HelpCircle, Save, Share2 } from 'lucide-react';
import { KCButton } from '../ui';

const StudioHeader = ({
  productName,
  productColor,
  price,
  onBack,
  onSave,
  onShare,
  onHelpToggle,
  isHelpOpen,
  helpContent,
}) => (
  <header className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-[#0F0F10]/80 bg-[#0F0F10]/95 border-b border-white/5">
    <div className="kc-container flex flex-wrap items-center justify-between gap-4 py-4">
      <div className="flex items-center gap-3 text-white">
        <KCButton
          variant="ghost"
          className="h-11 rounded-full border border-white/10 bg-white/5 px-5 text-white hover:bg-white/10"
          onClick={onBack}
          aria-label="Return to home"
          icon={<ArrowLeft size={18} />}
          iconPosition="left"
        >
          Home
        </KCButton>
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-white/60">Customize Your Canvas</p>
          <h1 className="mt-1 text-xl font-semibold text-white">{productName}</h1>
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-4 text-sm text-white/70">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1">
          <span className="block h-2.5 w-2.5 rounded-full" style={{ background: productColor?.value || 'var(--kc-gold-1)' }} />
          {productColor?.name || 'Custom'}
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 text-sm">
        <div className="rounded-[var(--kc-radius)] border border-white/10 bg-white/5 px-4 py-2 text-right text-white">
          <p className="text-xs uppercase tracking-[0.32em] text-white/60">Current Price</p>
          <p className="text-lg font-semibold">₹{price.toLocaleString()}</p>
        </div>

        <KCButton
          variant="ghost"
          className="border border-white/10 bg-white/5 px-4 py-2 text-white hover:bg-white/10"
          onClick={onSave}
          icon={<Save size={16} />}
        >
          Save
        </KCButton>
        <KCButton
          variant="ghost"
          className="border border-white/10 bg-white/5 px-4 py-2 text-white hover:bg-white/10"
          onClick={onShare}
          icon={<Share2 size={16} />}
        >
          Share
        </KCButton>
        <KCButton
          variant="ghost"
          className="relative border border-white/10 bg-white/5 px-4 py-2 text-white hover:bg-white/10"
          onClick={onHelpToggle}
          icon={<HelpCircle size={16} />}
        >
          Help
        </KCButton>
      </div>
    </div>

    {isHelpOpen ? (
      <div className="border-t border-white/5 bg-[#121214]/95">
        <div className="kc-container py-4 text-sm text-white/80">
          {helpContent}
        </div>
      </div>
    ) : null}
  </header>
);

export default StudioHeader;
