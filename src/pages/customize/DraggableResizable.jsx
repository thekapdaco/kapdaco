// src/components/Customize/DraggableResizable.jsx
import React, { useState, useRef, useCallback, useEffect } from "react";

const DraggableResizable = React.memo(({ 
  children, position, onPositionChange, size, onSizeChange, 
  rotation = 0, onRotationChange, opacity = 1,
  isSelected, onSelect, containerRef
}) => {
  // Provide default values for size and position if they're undefined
  const safeSize = size || { width: 180, height: 180 };
  const safePosition = position || { x: 50, y: 50 };
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ width: 0, height: 0, mouseX: 0, mouseY: 0 });
  const elementRef = useRef(null);

  const handleMouseDown = useCallback((e) => {
    if (e.target.classList.contains('resize-handle') || e.target.classList.contains('rotate-handle')) return;
    e.preventDefault();
    e.stopPropagation();
    if (onSelect) onSelect();
    setIsDragging(true);
    const rect = elementRef.current?.getBoundingClientRect();
    if (rect) setDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, [onSelect]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging && !isResizing && !isRotating) return;
    if (!containerRef.current) return;

    if (isDragging) {
      const containerRect = containerRef.current.getBoundingClientRect();
      let newX = ((e.clientX - dragStart.x - containerRect.left) / containerRect.width) * 100;
      let newY = ((e.clientY - dragStart.y - containerRect.top) / containerRect.height) * 100;
      if (window.snapToGrid) {
        newX = Math.round(newX / 5) * 5;
        newY = Math.round(newY / 5) * 5;
      }
      if (onPositionChange) {
        onPositionChange({ x: Math.max(0, Math.min(95, newX)), y: Math.max(0, Math.min(95, newY)) });
      }
    }
    if (isResizing && onSizeChange) {
      const deltaX = e.clientX - resizeStart.mouseX;
      const deltaY = e.clientY - resizeStart.mouseY;
      onSizeChange({ width: Math.max(20, resizeStart.width + deltaX), height: Math.max(20, resizeStart.height + deltaY) });
    }
    if (isRotating && elementRef.current && onRotationChange) {
      const rect = elementRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      onRotationChange((angle * 180) / Math.PI);
    }
  }, [isDragging, isResizing, isRotating, dragStart, resizeStart, onPositionChange, onSizeChange, onRotationChange, containerRef]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setIsRotating(false);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing || isRotating) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, isRotating, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={elementRef}
      style={{
        position: 'absolute', left: `${safePosition.x}%`, top: `${safePosition.y}%`,
        width: safeSize.width, height: safeSize.height,
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none',
        border: isSelected ? '2px dashed #60A5FA' : '2px solid transparent',
        zIndex: isSelected ? 10 : 1, opacity: opacity,
        transition: isSelected ? 'none' : 'border 0.2s ease',
      }}
      onMouseDown={handleMouseDown}
    >
      {children}
      {isSelected && (
        <>
          <div className="resize-handle" style={{
            position: 'absolute', bottom: '-8px', right: '-8px',
            width: '16px', height: '16px', backgroundColor: '#60A5FA',
            cursor: 'nw-resize', borderRadius: '3px', border: '2px solid white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }} onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsResizing(true);
            setResizeStart({ width: safeSize.width, height: safeSize.height, mouseX: e.clientX, mouseY: e.clientY });
          }} />
          {onRotationChange && (
            <div className="rotate-handle" style={{
              position: 'absolute', top: '-24px', left: '50%', transform: 'translateX(-50%)',
              width: '20px', height: '20px', backgroundColor: '#8B5CF6',
              cursor: 'grab', borderRadius: '50%', border: '3px solid white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }} onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsRotating(true);
            }} />
          )}
          {[{ top: '-8px', left: '-8px' }, { top: '-8px', right: '-8px' }, { bottom: '-8px', left: '-8px' }].map((pos, i) => (
            <div key={i} style={{
              position: 'absolute', ...pos, width: '8px', height: '8px',
              backgroundColor: '#60A5FA', borderRadius: '50%',
              border: '2px solid white', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            }} />
          ))}
        </>
      )}
    </div>
  );
});

export default DraggableResizable;