import React from 'react';
import {
  RotateCcw,
  RotateCw,
  History,
  Maximize2,
  Droplet,
  RefreshCcw,
} from 'lucide-react';
import { KCButton } from '../ui';

const FloatingTools = ({
  onUndo,
  onRedo,
  onReset,
  onFullscreen,
  backdropColor,
  onBackdropColorChange,
  disabledUndo,
  disabledRedo,
}) => {
  const handleUndo = () => {
    if (typeof onUndo === 'function') {
      onUndo();
    }
  };

  const handleRedo = () => {
    if (typeof onRedo === 'function') {
      onRedo();
    }
  };

  const handleReset = () => {
    if (typeof onReset === 'function') {
      onReset();
    }
  };

  const handleFullscreen = () => {
    if (typeof onFullscreen === 'function') {
      onFullscreen();
    }
  };

  return (
    <div className="pointer-events-auto flex flex-col gap-3 rounded-[var(--kc-radius-lg)] border border-white/10 bg-white/5 p-3 text-white shadow-[var(--kc-shadow-sm)] backdrop-blur">
      <div className="flex items-center gap-3">
        <KCButton
          variant="ghost"
          className="h-10 w-10 rounded-full border border-white/10 bg-transparent text-white hover:bg-white/10"
          onClick={handleUndo}
          icon={<RotateCcw size={16} />}
          disabled={disabledUndo}
          aria-label="Undo"
        />
        <span className="text-xs text-white/70">Undo</span>
      </div>
      <div className="flex items-center gap-3">
        <KCButton
          variant="ghost"
          className="h-10 w-10 rounded-full border border-white/10 bg-transparent text-white hover:bg-white/10"
          onClick={handleRedo}
          icon={<RotateCw size={16} />}
          disabled={disabledRedo}
          aria-label="Redo"
        />
        <span className="text-xs text-white/70">Redo</span>
      </div>
      <div className="flex items-center gap-3">
        <KCButton
          variant="ghost"
          className="h-10 w-10 rounded-full border border-white/10 bg-transparent text-white hover:bg-white/10"
          onClick={handleReset}
          icon={<RefreshCcw size={16} />}
          aria-label="Reset design"
        />
        <span className="text-xs text-white/70">Reset</span>
      </div>
      <div className="flex items-center gap-3">
        <KCButton
          variant="ghost"
          className="h-10 w-10 rounded-full border border-white/10 bg-transparent text-white hover:bg-white/10"
          onClick={handleFullscreen}
          icon={<Maximize2 size={16} />}
          aria-label="Enter fullscreen"
        />
        <span className="text-xs text-white/70">Fullscreen</span>
      </div>
      <div className="flex items-center gap-3">
        <label className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-transparent text-white hover:bg-white/10">
          <Droplet size={16} />
          <input
            type="color"
            value={backdropColor}
            onChange={(e) => onBackdropColorChange?.(e.target.value)}
            className="absolute h-10 w-10 cursor-pointer opacity-0"
            aria-label="Change backdrop color"
          />
        </label>
        <span className="text-xs text-white/70">Backdrop</span>
      </div>
      <div className="flex items-center gap-3 opacity-40">
        <KCButton
          variant="ghost"
          className="h-10 w-10 rounded-full border border-white/10 bg-transparent text-white hover:bg-white/10"
          icon={<History size={16} />}
          aria-label="View history"
          disabled
        />
        <span className="text-xs text-white/70">History (soon)</span>
      </div>
    </div>
  );
};

export default FloatingTools;
