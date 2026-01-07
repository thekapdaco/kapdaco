// src/components/Customize/DesignTools.jsx
import React from "react";
import { Upload, Type } from 'lucide-react';
import { TEXT_STYLES } from './customizeConstants';
import styles from './styles';

const DesignTools = React.memo(({ 
  uploadedImage, customText, textColor, textSize, selectedTextStyle,
  onImageUpload, onTextChange, onTextColorChange, onTextSizeChange, onSelectTextStyle,
  onRemoveImage, previewComponent, elementControlsComponent, viewControlsComponent
}) => (
  <div style={styles.section}>
    <h2 style={styles.sectionTitle}>Design Your Masterpiece</h2>
    <div style={styles.stepWithPreview}>
      <div style={styles.designContainer}>
        <div style={styles.designTools}>
          <div style={styles.toolGroup}>
            <h3 style={styles.toolTitle}>
              <Upload size={18} style={{verticalAlign: 'middle', marginRight: '8px'}} />
              Upload Image
            </h3>
            <input type="file" accept="image/*" onChange={onImageUpload} style={styles.fileInput} />
            {uploadedImage && (
              <div style={styles.imagePreviewContainer}>
                <img src={uploadedImage} alt="Preview" style={styles.imagePreview} />
                <button onClick={onRemoveImage} style={styles.removeButton}>✕</button>
              </div>
            )}
          </div>
          <div style={styles.toolGroup}>
            <h3 style={styles.toolTitle}>
              <Type size={18} style={{verticalAlign: 'middle', marginRight: '8px'}} />
              Add Text
            </h3>
            <input type="text" value={customText} onChange={onTextChange}
              placeholder="Enter your text" style={styles.textInput} />
            <div style={styles.textControls}>
              <div style={styles.controlGroup}>
                <label style={styles.controlLabel}>Color:</label>
                <input type="color" value={textColor} onChange={onTextColorChange} style={styles.colorInput} />
              </div>
              <div style={styles.controlGroup}>
                <label style={styles.controlLabel}>Size:</label>
                <input type="range" min="12" max="48" value={textSize}
                  onChange={onTextSizeChange} style={styles.rangeInput} />
                <span style={{fontWeight: '600', minWidth: '45px', textAlign: 'right'}}>{textSize}px</span>
              </div>
            </div>
            <div style={styles.styleButtons}>
              {TEXT_STYLES.map((style) => (
                <button key={style.name} style={{
                  ...styles.styleButton,
                  ...(selectedTextStyle.name === style.name ? styles.selectedStyleButton : {}),
                  ...style.style
                }} onClick={() => onSelectTextStyle(style)}>
                  {style.name}
                </button>
              ))}
            </div>
          </div>
        </div>
        {elementControlsComponent}
        {viewControlsComponent}
      </div>
      {previewComponent}
    </div>
  </div>
));

export default DesignTools;