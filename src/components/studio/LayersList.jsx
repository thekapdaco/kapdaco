import React from 'react';
import { Eye, EyeOff, Lock, Unlock, Copy, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { KCButton } from '../ui';

const LayersList = ({ layers, onToggleVisibility, onToggleLock, onDuplicate, onMoveLayer, onSelect, activeLayerId }) => (
  <div className="space-y-3">
    {layers.map((layer, index) => (
      <div
        key={layer.id}
        className={`flex items-center gap-3 rounded-[var(--kc-radius)] border border-white/10 bg-white/[0.04] px-3 py-2 text-white/80 transition ${activeLayerId === layer.id ? 'border-[var(--kc-gold-1)] bg-white/10 text-white' : ''}`}
        onClick={() => onSelect(layer.id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(layer.id);
          }
        }}
      >
        <GripVertical size={14} className="text-white/40" />
        <div className="flex flex-1 flex-col">
          <span className="text-sm font-semibold">{layer.name}</span>
          <span className="text-xs text-white/50">{layer.type}</span>
        </div>
        <div className="flex items-center gap-2">
          <KCButton
            variant="ghost"
            className="h-8 w-8 rounded-full border border-white/10 bg-transparent text-white hover:bg-white/10"
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisibility(layer.id);
            }}
            icon={layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
            aria-label={layer.visible ? 'Hide layer' : 'Show layer'}
          />
          <KCButton
            variant="ghost"
            className="h-8 w-8 rounded-full border border-white/10 bg-transparent text-white hover:bg-white/10"
            onClick={(e) => {
              e.stopPropagation();
              onToggleLock(layer.id);
            }}
            icon={layer.locked ? <Lock size={14} /> : <Unlock size={14} />}
            aria-label={layer.locked ? 'Unlock layer' : 'Lock layer'}
          />
          <KCButton
            variant="ghost"
            className="h-8 w-8 rounded-full border border-white/10 bg-transparent text-white hover:bg-white/10"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(layer.id);
            }}
            icon={<Copy size={14} />}
            aria-label="Duplicate layer"
          />
        </div>
        <div className="flex flex-col items-center gap-1 pl-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMoveLayer(layer.id, 'up');
            }}
            disabled={index === 0}
            className="flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-transparent text-white/70 transition hover:bg-white/10 disabled:opacity-30"
          >
            <ChevronUp size={12} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMoveLayer(layer.id, 'down');
            }}
            disabled={index === layers.length - 1}
            className="flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-transparent text-white/70 transition hover:bg-white/10 disabled:opacity-30"
          >
            <ChevronDown size={12} />
          </button>
        </div>
      </div>
    ))}
  </div>
);

export default LayersList;
