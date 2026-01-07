import React from 'react';

const TabPanel = ({ tabs, activeTab, onTabChange }) => (
  <div className="flex flex-col gap-4">
    <div className="flex overflow-x-auto rounded-[var(--kc-radius-lg)] border border-white/10 bg-white/5 p-1 text-sm text-white/70">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={[
            'flex min-w-[120px] items-center justify-center gap-2 rounded-[var(--kc-radius)] px-4 py-3 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kc-gold-1)]',
            activeTab === tab.id
              ? 'bg-[var(--kc-gold-1)] text-[var(--kc-ink)] shadow-[0_15px_40px_rgba(211,167,95,0.32)]'
              : 'text-white/70',
          ].join(' ')}
          aria-pressed={activeTab === tab.id}
        >
          {tab.icon ? <tab.icon size={16} /> : null}
          <span className="whitespace-nowrap font-semibold">{tab.label}</span>
        </button>
      ))}
    </div>

    <div className="rounded-[var(--kc-radius-lg)] border border-white/10 bg-white/5 p-6 text-sm text-white/80 shadow-[var(--kc-shadow-md)]">
      {tabs.find((tab) => tab.id === activeTab)?.content}
    </div>
  </div>
);

export default TabPanel;
