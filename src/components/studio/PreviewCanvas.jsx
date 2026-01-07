import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Grid as GridIcon, Shield, ZoomIn, ZoomOut } from 'lucide-react';
import FloatingTools from './FloatingTools.jsx';
import DraggableResizable from '../../pages/customize/DraggableResizable.jsx';

const gridBackground =
  'linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.04) 1px, transparent 1px)';

const PreviewCanvas = ({
  selectedProduct,
  selectedColor,
  previewMode,
  onModeChange,
  zoom,
  onZoomChange,
  snapEnabled,
  onToggleSnap,
  showGrid,
  setShowGrid,
  showSafeArea,
  setShowSafeArea,
  backdropColor,
  onBackdropColorChange,
  previewRef,
  productImage,
  layers,
  uploadedImage,
  imagePosition,
  setImagePosition,
  imageSize,
  setImageSize,
  imageRotation,
  setImageRotation,
  imageOpacity,
  customText,
  textConfig,
  textBoxSize,
  setTextBoxSize,
  textPosition,
  setTextPosition,
  textRotation,
  setTextRotation,
  textOpacity,
  selectedElement,
  setSelectedElement,
  onUndo,
  onRedo,
  onReset,
  onFullscreen,
  canUndo,
  canRedo,
}) => {
  const zoomPercent = Math.round(zoom * 100);

  const safeAreaStyles = useMemo(
    () => ({
      border: showSafeArea ? '2px dashed rgba(255,255,255,0.18)' : 'none',
      borderRadius: 'calc(var(--kc-radius-lg) - 12px)',
    }),
    [showSafeArea]
  );

  const textStyle = useMemo(() => {
    const gradient = textConfig?.gradient
      ? {
          background: textConfig.gradient,
          WebkitBackgroundClip: 'text',
          color: 'transparent',
        }
      : { color: textConfig?.color || '#ffffff' };

    return {
      fontFamily: textConfig?.fontFamily || 'Inter, sans-serif',
      fontWeight: textConfig?.fontWeight || 600,
      fontSize: `${textConfig?.fontSize || 34}px`,
      letterSpacing: `${textConfig?.letterSpacing ?? 0}px`,
      lineHeight: textConfig?.lineHeight ?? 1.2,
      textTransform: textConfig?.uppercase ? 'uppercase' : 'none',
      textAlign: textConfig?.textAlign || 'center',
      textShadow: textConfig?.shadow ? '0 8px 24px rgba(0,0,0,0.35)' : 'none',
      WebkitTextStroke: textConfig?.outline ? '1px rgba(0,0,0,0.35)' : 'none',
      filter: textConfig?.blur ? `blur(${textConfig.blur}px)` : 'none',
      ...gradient,
    };
  }, [textConfig]);

  return (
    <div className="relative flex w-full items-start gap-6">
      <div className="hidden lg:block">
        <FloatingTools
          onUndo={onUndo}
          onRedo={onRedo}
          onReset={onReset}
          onFullscreen={onFullscreen}
          backdropColor={backdropColor}
          onBackdropColorChange={onBackdropColorChange}
          disabledUndo={!canUndo}
          disabledRedo={!canRedo}
        />
      </div>

      <div className="relative flex-1">
        <motion.div
          className="mb-4 flex items-center justify-between text-xs text-white/70"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-center gap-2">
            {selectedProduct?.hasFrontBack !== false ? (
              <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1">
                {['front', 'back'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => onModeChange(mode)}
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-semibold capitalize transition',
                      previewMode === mode
                        ? 'bg-[var(--kc-gold-1)] text-[var(--kc-ink)] shadow-[0_10px_30px_rgba(211,167,95,0.35)]'
                        : 'text-white/70 hover:text-white'
                    )}
                    aria-pressed={previewMode === mode}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setShowGrid((prev) => !prev)}
              className={cn(
                'flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 transition',
                showGrid ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white'
              )}
            >
              <GridIcon size={14} /> Grid
            </button>
            <button
              type="button"
              onClick={() => setShowSafeArea((prev) => !prev)}
              className={cn(
                'flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 transition',
                showSafeArea ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white'
              )}
            >
              <Shield size={14} /> Safe area
            </button>
          </div>
        </motion.div>

        <motion.div
          className="relative overflow-hidden rounded-[var(--kc-radius-lg)] border border-white/10 bg-[#121214]/80 p-6 shadow-[var(--kc-shadow-md)]"
          data-preview-shell
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div
            className="relative mx-auto h-[520px] w-full max-w-[520px] overflow-hidden rounded-[var(--kc-radius-lg)]"
            style={{
              backgroundColor: backdropColor,
              backgroundImage: showGrid ? gridBackground : 'none',
              backgroundSize: '40px 40px',
            }}
          >
            <div
              ref={previewRef}
              className="relative h-full w-full origin-center"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
                transition: 'transform 0.3s ease',
              }}
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) setSelectedElement(null);
              }}
            >
              <motion.div
                className="absolute inset-0"
                style={{ borderRadius: 'calc(var(--kc-radius-lg) - 6px)', overflow: 'hidden' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                {productImage ? (
                  <img
                    src={productImage}
                    crossOrigin="anonymous"
                    alt={`${selectedProduct?.name || 'Product'} ${previewMode}`}
                    className="h-full w-full object-cover"
                  />
                ) : null}
                <div className="absolute inset-0" style={safeAreaStyles} />

                {layers.map((layer) => {
                  if (layer.id === 'image' && uploadedImage) {
                    return (
                      <DraggableResizable
                        key="layer-image"
                        position={imagePosition}
                        onPositionChange={(value) => !layer.locked && layer.visible && setImagePosition(value)}
                        size={imageSize}
                        onSizeChange={(value) => !layer.locked && layer.visible && setImageSize(value)}
                        rotation={imageRotation}
                        onRotationChange={(value) => !layer.locked && layer.visible && setImageRotation(value)}
                        opacity={layer.visible ? imageOpacity : 0}
                        isSelected={selectedElement === 'image'}
                        onSelect={() => !layer.locked && setSelectedElement('image')}
                        containerRef={previewRef}
                        snapEnabled={snapEnabled}
                        disabled={layer.locked}
                      >
                        <img src={uploadedImage} alt="Custom upload" className="h-full w-full object-contain" />
                      </DraggableResizable>
                    );
                  }
                  if (layer.id === 'text' && customText) {
                    return (
                      <DraggableResizable
                        key="layer-text"
                        position={textPosition}
                        onPositionChange={(value) => !layer.locked && layer.visible && setTextPosition(value)}
                        size={textBoxSize}
                        onSizeChange={(value) => !layer.locked && layer.visible && setTextBoxSize(value)}
                        rotation={textRotation}
                        onRotationChange={(value) => !layer.locked && layer.visible && setTextRotation(value)}
                        opacity={layer.visible ? textOpacity : 0}
                        isSelected={selectedElement === 'text'}
                        onSelect={() => !layer.locked && setSelectedElement('text')}
                        containerRef={previewRef}
                        snapEnabled={snapEnabled}
                        disabled={layer.locked}
                      >
                        <div
                          className="flex h-full w-full items-center justify-center px-2"
                          style={textStyle}
                        >
                          {customText}
                        </div>
                      </DraggableResizable>
                    );
                  }
                  return null;
                })}
              </motion.div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between text-xs text-white/70">
            <div className="flex items-center gap-2">
              <ZoomOut size={14} />
              <input
                type="range"
                min="0.6"
                max="1.8"
                step="0.02"
                value={zoom}
                onChange={(e) => onZoomChange(Number(e.target.value))}
                className="h-1 w-40 rounded-full accent-[var(--kc-gold-1)]"
                aria-label="Zoom"
              />
              <ZoomIn size={14} />
              <span className="ml-2 text-xs">{zoomPercent}%</span>
            </div>
            <button
              type="button"
              onClick={() => onToggleSnap?.((prev) => !prev)}
              className={cn(
                'rounded-full border border-white/10 px-3 py-1 text-xs transition',
                snapEnabled ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white'
              )}
            >
              Snap guides {snapEnabled ? 'on' : 'off'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default PreviewCanvas;
