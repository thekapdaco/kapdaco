/**
 * Accessibility Utilities
 * Focus management, keyboard navigation, ARIA helpers
 */

/**
 * Trap focus within a container (for modals, dropdowns)
 */
export const trapFocus = (containerElement, previousActiveElement = null) => {
  if (!containerElement) return null;

  const focusableElements = containerElement.querySelectorAll(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleTabKey = (e) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  };

  containerElement.addEventListener('keydown', handleTabKey);
  firstElement?.focus();

  // Return cleanup function
  return () => {
    containerElement.removeEventListener('keydown', handleTabKey);
    previousActiveElement?.focus();
  };
};

/**
 * Get all focusable elements in a container
 */
export const getFocusableElements = (container) => {
  if (!container) return [];
  
  return Array.from(
    container.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  );
};

/**
 * Handle Escape key to close modals/dropdowns
 */
export const handleEscapeKey = (callback) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      callback();
    }
  };

  document.addEventListener('keydown', handleKeyDown);
  
  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
};

/**
 * Standardize focus-visible styles
 */
export const focusVisibleStyles = {
  outline: '2px solid var(--kc-gold-200)',
  outlineOffset: '2px',
  borderRadius: 'var(--kc-radius-sm)',
};

/**
 * Check if element is visible and focusable
 */
export const isFocusable = (element) => {
  if (!element) return false;
  
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
    return false;
  }
  
  return element.tabIndex >= 0 || 
         element.tagName === 'A' || 
         element.tagName === 'BUTTON' || 
         ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName);
};

