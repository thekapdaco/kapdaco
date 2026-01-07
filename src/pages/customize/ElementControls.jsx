// src/components/Customize/ElementControls.jsx
import React from "react";
import { RotateCw, Copy, Trash2 } from 'lucide-react';
import styles from './styles';
import { KCButton } from '../../components/ui';
import { cn } from '../../lib/cn';

const ElementControls = React.memo(({ 
  selectedElement, imagePosition, imageSize, imageRotation, imageOpacity,
  textPosition, textSize2, textRotation, textOpacity,
  onImageChange, onTextChange, onReset, onDuplicate, onDelete
}) => {
  if (!selectedElement) return null;
  
  const isImage = selectedElement === 'image';
  const controls = isImage ? [
    { label: 'Position X', value: imagePosition.x, onChange: (v) => onImageChange('position', 'x', v), min: 0, max: 100, step: 0.5, unit: '%' },
    { label: 'Position Y', value: imagePosition.y, onChange: (v) => onImageChange('position', 'y', v), min: 0, max: 100, step: 0.5, unit: '%' },
    { label: 'Width', value: imageSize.width, onChange: (v) => onImageChange('size', 'width', v), min: 20, max: 220, step: 1, unit: 'px' },
    { label: 'Height', value: imageSize.height, onChange: (v) => onImageChange('size', 'height', v), min: 20, max: 220, step: 1, unit: 'px' },
    { label: 'Opacity', value: imageOpacity, onChange: (v) => onImageChange('opacity', null, v), min: 0.1, max: 1, step: 0.1, unit: '%', multiply: 100 },
    { label: 'Rotation', value: imageRotation, onChange: (v) => onImageChange('rotation', null, v), min: 0, max: 360, step: 1, unit: '°' },
  ] : [
    { label: 'Position X', value: textPosition.x, onChange: (v) => onTextChange('position', 'x', v), min: 0, max: 100, step: 0.5, unit: '%' },
    { label: 'Position Y', value: textPosition.y, onChange: (v) => onTextChange('position', 'y', v), min: 0, max: 100, step: 0.5, unit: '%' },
    { label: 'Box Width', value: textSize2.width, onChange: (v) => onTextChange('size', 'width', v), min: 60, max: 260, step: 1, unit: 'px' },
    { label: 'Box Height', value: textSize2.height, onChange: (v) => onTextChange('size', 'height', v), min: 20, max: 200, step: 1, unit: 'px' },
    { label: 'Opacity', value: textOpacity, onChange: (v) => onTextChange('opacity', null, v), min: 0.1, max: 1, step: 0.1, unit: '%', multiply: 100 },
    { label: 'Rotation', value: textRotation, onChange: (v) => onTextChange('rotation', null, v), min: 0, max: 360, step: 1, unit: '°' },
  ];

  return (
    <div style={styles.elementControls}>
      <h4 style={{margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: '600', color: 'var(--kc-ink)'}}>
        Editing: {isImage ? 'Image' : 'Text'}
      </h4>
      <div style={styles.advancedControls}>
        {controls.map((ctrl, idx) => (
          <div key={idx} style={styles.controlGroup}>
            <label style={styles.controlLabel}>{ctrl.label}:</label>
            <input type="range" min={ctrl.min} max={ctrl.max} step={ctrl.step}
              value={ctrl.value} onChange={(e) => ctrl.onChange(parseFloat(e.target.value))}
              style={styles.rangeInput} />
            <span style={{fontWeight: '600', minWidth: '50px', textAlign: 'right'}}>
              {ctrl.multiply ? Math.round(ctrl.value * ctrl.multiply) : ctrl.value.toFixed(ctrl.step < 1 ? 1 : 0)}{ctrl.unit}
            </span>
          </div>
        ))}
      </div>
      <div style={styles.controlButtons}>
        <KCButton
          type="button"
          variant="ghost"
          icon={<RotateCw size={16} />}
          className="px-3 py-2 text-sm font-semibold"
          onClick={onReset}
        >
          Reset
        </KCButton>
        <KCButton
          type="button"
          variant="ghost"
          icon={<Copy size={16} />}
          className="px-3 py-2 text-sm font-semibold"
          onClick={onDuplicate}
        >
          Duplicate
        </KCButton>
        <KCButton
          type="button"
          variant="ghost"
          icon={<Trash2 size={16} />}
          className={cn('px-3 py-2 text-sm font-semibold text-white bg-[var(--kc-danger)] hover:shadow-[var(--kc-shadow-sm)] border border-[var(--kc-danger)]')}
          onClick={onDelete}
        >
          Delete
        </KCButton>
      </div>
    </div>
  );
});

export default ElementControls;