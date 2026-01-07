// src/Customize/LivePreview.jsx
import React from "react";
import { Sparkles } from 'lucide-react';
import DraggableResizable from './DraggableResizable';
import styles from './styles';



const LivePreview = React.memo(({ 
  selectedProduct, selectedColor, selectedSize, uploadedImage, customText,
  imagePosition, textPosition, imageSize, textSize2, imageRotation, textRotation,
  imageOpacity, textOpacity, textColor, textSize, selectedTextStyle,
  selectedElement, setSelectedElement, setImagePosition, setTextPosition,
  setImageSize, setTextSize2, setImageRotation, setTextRotation,
  previewMode, previewRef, onSetPreviewMode 
}) => {
  // Get the correct product image based on front/back and color
  const getProductImage = () => {
    const colorVariant = selectedProduct?.colorVariants?.[selectedColor.name];
    
    // Check if colorVariant has front/back structure
    if (colorVariant && typeof colorVariant === 'object' && colorVariant.front) {
      return previewMode === 'front' ? colorVariant.front : colorVariant.back;
    }
    
    // Otherwise, it's a simple string URL (for accessories)
    return colorVariant || selectedProduct?.imageUrl;
  };

  const productColorImage = getProductImage();
  const showFrontBackToggle = selectedProduct?.hasFrontBack !== false;

  return (
    <div style={styles.livePreviewContainer}>
      <div style={styles.previewHeader}>
        <Sparkles size={18} style={{color: 'var(--kc-gold)'}} />
        <h3 style={styles.previewTitle}>Live Preview</h3>
      </div>
      
      {/* Only show front/back toggle if product supports it */}
      {showFrontBackToggle && (
        <div style={styles.previewModeButtons}>
          {['front', 'back'].map(mode => (
            <button key={mode} style={{
              ...styles.modeButton,
              ...(previewMode === mode ? styles.activeModeButton : {})
            }} onClick={() => onSetPreviewMode(mode)}>
              {mode === 'front' ? 'Front' : 'Back'}
            </button>
          ))}
        </div>
      )}
      
      <div style={styles.productPreview}>
        <div ref={previewRef} style={styles.productMockup} onMouseDown={(e) => { if (e.target === e.currentTarget) setSelectedElement(null); }}>
          
          {productColorImage && (
            <img src={productColorImage} crossOrigin="anonymous" alt={`${selectedProduct.name} ${previewMode} in ${selectedColor.name}`} style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 0,
              pointerEvents: 'none'
            }} />
          )}
          
          {uploadedImage && (
            <DraggableResizable
              position={imagePosition} onPositionChange={setImagePosition}
              size={imageSize} onSizeChange={setImageSize}
              rotation={imageRotation} onRotationChange={setImageRotation}
              opacity={imageOpacity} isSelected={selectedElement === 'image'}
              onSelect={() => setSelectedElement('image')} containerRef={previewRef}
            >
              <img src={uploadedImage} alt="Custom" style={{
                width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none'
              }} />
            </DraggableResizable>
          )}
          {customText && (
            <DraggableResizable
              position={textPosition} onPositionChange={setTextPosition}
              size={textSize2} onSizeChange={setTextSize2}
              rotation={textRotation} onRotationChange={setTextRotation}
              opacity={textOpacity} isSelected={selectedElement === 'text'}
              onSelect={() => setSelectedElement('text')} containerRef={previewRef}
            >
              <div style={{
                width: '100%', height: '100%', color: textColor, fontSize: `${textSize}px`,
                ...selectedTextStyle.style, display: 'flex', alignItems: 'center',
                justifyContent: 'center', textAlign: 'center', wordBreak: 'break-word',
                pointerEvents: 'none', lineHeight: 1.2
              }}>
                {customText}
              </div>
            </DraggableResizable>
          )}
        </div>
      </div>
      <div style={styles.productSummary}>
        <h4 style={{margin: '0 0 12px 0', fontSize: '1rem', fontWeight: '600'}}>Current Selection</h4>
        <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
          <p style={{margin: 0}}><strong>{selectedProduct.name}</strong></p>
          <p style={{margin: 0, color: 'var(--kc-gray-500)'}}>Size: {selectedSize}</p>
          {selectedProduct?.hasColorOptions !== false && (
            <p style={{margin: 0, color: 'var(--kc-gray-500)'}}>Color: {selectedColor.name}</p>
          )}
          {showFrontBackToggle && (
            <p style={{margin: 0, color: 'var(--kc-gray-500)'}}>View: {previewMode === 'front' ? 'Front' : 'Back'}</p>
          )}
          <p style={{margin: 0, fontSize: '1.2rem', fontWeight: '700', color: 'var(--kc-gold)', marginTop: '8px'}}>₹{selectedProduct.price}</p>
        </div>
      </div>
    </div>
  );
});

export default LivePreview;