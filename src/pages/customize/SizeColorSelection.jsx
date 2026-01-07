// src/Customize/SizeColorSelection.jsx
import React from "react";
import { APPAREL_SIZES, COLORS } from './customizeConstants';
import styles from './styles';



const SizeColorSelection = React.memo(({ 
  selectedProduct, selectedSize, selectedOption, selectedColor,
  onSelectSize, onSelectOption, onSelectColor
}) => {
  // Check if product has color options
  const hasColorOptions = selectedProduct?.hasColorOptions !== false;
  const availableColors = hasColorOptions 
    ? COLORS.filter(color => selectedProduct.colorVariants?.[color.name])
    : [];

  return (
    <div style={styles.section}>
      <h2 style={styles.sectionTitle}>Size & Color Selection</h2>
      <div style={styles.centeredContainer}>
        <div style={styles.optionsContainerCentered}>
          {selectedProduct.hasSize && (
            <div style={styles.optionGroup}>
              <h3 style={styles.optionTitle}>Select Size</h3>
              <div style={styles.sizeGrid}>
                {APPAREL_SIZES.map((size) => (
                  <button key={size} style={{
                    ...styles.sizeButton,
                    ...(selectedSize === size ? styles.selectedButton : {})
                  }} onClick={() => onSelectSize(size)}>
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}
          {!selectedProduct.hasSize && selectedProduct.options && (
            <div style={styles.optionGroup}>
              <h3 style={styles.optionTitle}>
                {selectedProduct.name.includes('Cap') ? 'Fit' : 'Size'}
              </h3>
              <div style={styles.sizeGrid}>
                {selectedProduct.options.map((option) => (
                  <button key={option} style={{
                    ...styles.sizeButton,
                    ...(selectedOption === option ? styles.selectedButton : {})
                  }} onClick={() => onSelectOption(option)}>
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Only show color selection if product has color options */}
          {hasColorOptions && availableColors.length > 0 && (
            <div style={styles.optionGroup}>
              <h3 style={styles.optionTitle}>Base Color</h3>
              <p style={{fontSize: '0.9rem', color: 'var(--kc-gray-500)', marginBottom: '16px'}}>
                The colored product will appear in the design step
              </p>
              <div style={styles.colorGrid}>
                {availableColors.map((color) => (
                  <div
                    key={color.name}
                    style={{
                      ...styles.colorOption,
                      backgroundColor: color.value,
                      ...(selectedColor.name === color.name ? styles.selectedColor : {})
                    }}
                    onClick={() => onSelectColor(color)}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default SizeColorSelection;