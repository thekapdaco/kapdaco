/**
 * Contrast utility functions for WCAG compliance checking
 * 
 * These utilities help ensure text meets WCAG AA standards:
 * - Normal text: 4.5:1 contrast ratio
 * - Large text (18pt+ or 14pt+ bold): 3:1 contrast ratio
 */

/**
 * Converts a hex color to RGB values
 * @param {string} hex - Hex color (with or without #)
 * @returns {Object} RGB object with r, g, b values (0-255)
 */
export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Converts an rgba color string to RGB with opacity
 * @param {string} rgbaString - RGBA string like "rgba(248, 244, 238, 0.95)"
 * @returns {Object} Object with r, g, b, a values
 */
export function parseRgba(rgbaString) {
  const match = rgbaString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match) return null;

  return {
    r: parseInt(match[1], 10),
    g: parseInt(match[2], 10),
    b: parseInt(match[3], 10),
    a: match[4] ? parseFloat(match[4]) : 1,
  };
}

/**
 * Calculates the relative luminance of a color
 * Based on WCAG 2.1 formula
 * @param {number} r - Red channel (0-255)
 * @param {number} g - Green channel (0-255)
 * @param {number} b - Blue channel (0-255)
 * @returns {number} Relative luminance (0-1)
 */
export function getLuminance(r, g, b) {
  // Normalize RGB values
  const [rs, gs, bs] = [r, g, b].map((val) => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });

  // Calculate relative luminance
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculates contrast ratio between two colors
 * @param {Object} color1 - RGB object {r, g, b} or {r, g, b, a} with background
 * @param {Object} color2 - RGB object {r, g, b} or {r, g, b, a} with background
 * @param {Object} backgroundColor - Optional background color if colors have alpha
 * @returns {number} Contrast ratio (1-21)
 */
export function getContrastRatio(color1, color2, backgroundColor = null) {
  // Handle alpha channel by blending with background
  let rgb1 = { ...color1 };
  let rgb2 = { ...color2 };

  if (backgroundColor && (color1.a !== undefined || color2.a !== undefined)) {
    if (color1.a !== undefined && color1.a < 1) {
      rgb1 = blendWithBackground(color1, backgroundColor);
    }
    if (color2.a !== undefined && color2.a < 1) {
      rgb2 = blendWithBackground(color2, backgroundColor);
    }
  }

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  // Ensure lighter color is in numerator
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Blends a semi-transparent color with a background color
 * @param {Object} foreground - RGBA color {r, g, b, a}
 * @param {Object} background - RGB background color {r, g, b}
 * @returns {Object} Blended RGB color {r, g, b}
 */
function blendWithBackground(foreground, background) {
  const alpha = foreground.a || 1;
  return {
    r: Math.round(foreground.r * alpha + background.r * (1 - alpha)),
    g: Math.round(foreground.g * alpha + background.g * (1 - alpha)),
    b: Math.round(foreground.b * alpha + background.b * (1 - alpha)),
  };
}

/**
 * Checks if contrast ratio meets WCAG AA standards
 * @param {number} contrastRatio - Contrast ratio to check
 * @param {boolean} isLargeText - Whether text is large (18pt+ or 14pt+ bold)
 * @returns {Object} Result object with passed status and level
 */
export function meetsWCAGAA(contrastRatio, isLargeText = false) {
  const requiredRatio = isLargeText ? 3 : 4.5;
  const passed = contrastRatio >= requiredRatio;

  return {
    passed,
    requiredRatio,
    actualRatio: contrastRatio,
    level: passed ? 'AA' : 'FAIL',
    isLargeText,
  };
}

/**
 * Checks if contrast ratio meets WCAG AAA standards
 * @param {number} contrastRatio - Contrast ratio to check
 * @param {boolean} isLargeText - Whether text is large (18pt+ or 14pt+ bold)
 * @returns {Object} Result object with passed status and level
 */
export function meetsWCAGAAA(contrastRatio, isLargeText = false) {
  const requiredRatio = isLargeText ? 4.5 : 7;
  const passed = contrastRatio >= requiredRatio;

  return {
    passed,
    requiredRatio,
    actualRatio: contrastRatio,
    level: passed ? 'AAA' : 'AA',
    isLargeText,
  };
}

/**
 * Validates text color contrast against background
 * Supports hex, rgb, rgba, and CSS variable strings
 * @param {string} textColor - Text color (hex, rgb, rgba, or CSS variable)
 * @param {string} backgroundColor - Background color (hex, rgb, rgba, or CSS variable)
 * @param {boolean} isLargeText - Whether text is large text
 * @returns {Object} Validation result
 */
export function validateContrast(textColor, backgroundColor, isLargeText = false) {
  try {
    let textRgb = null;
    let bgRgb = null;

    // Parse text color
    if (textColor.startsWith('var(--')) {
      // CSS variable - would need to get computed value in browser
      return {
        error: 'CSS variables require browser environment. Use computed values.',
      };
    } else if (textColor.startsWith('rgba')) {
      textRgb = parseRgba(textColor);
    } else if (textColor.startsWith('rgb')) {
      textRgb = parseRgba(textColor.replace('rgb', 'rgba').replace(')', ', 1)'));
    } else if (textColor.startsWith('#')) {
      textRgb = hexToRgb(textColor);
      if (textRgb) textRgb.a = 1;
    }

    // Parse background color
    if (backgroundColor.startsWith('var(--')) {
      return {
        error: 'CSS variables require browser environment. Use computed values.',
      };
    } else if (backgroundColor.startsWith('rgba')) {
      bgRgb = parseRgba(backgroundColor);
    } else if (backgroundColor.startsWith('rgb')) {
      bgRgb = parseRgba(backgroundColor.replace('rgb', 'rgba').replace(')', ', 1)'));
    } else if (backgroundColor.startsWith('#')) {
      bgRgb = hexToRgb(backgroundColor);
      if (bgRgb) bgRgb.a = 1;
    }

    if (!textRgb || !bgRgb) {
      return {
        error: 'Unable to parse color values',
        textColor,
        backgroundColor,
      };
    }

    const contrastRatio = getContrastRatio(textRgb, bgRgb);
    const aaResult = meetsWCAGAA(contrastRatio, isLargeText);
    const aaaResult = meetsWCAGAAA(contrastRatio, isLargeText);

    return {
      contrastRatio: Math.round(contrastRatio * 100) / 100,
      ...aaResult,
      aaa: aaaResult.passed,
      textColor: textRgb,
      backgroundColor: bgRgb,
    };
  } catch (error) {
    return {
      error: error.message,
      textColor,
      backgroundColor,
    };
  }
}

/**
 * Logs contrast warnings for text elements that fail WCAG AA
 * Use this in development to identify contrast issues
 * @param {string} elementId - Element identifier for logging
 * @param {string} textColor - Text color value
 * @param {string} backgroundColor - Background color value
 * @param {boolean} isLargeText - Whether text is large
 */
export function logContrastWarning(elementId, textColor, backgroundColor, isLargeText = false) {
  const result = validateContrast(textColor, backgroundColor, isLargeText);

  if (result.error) {
    console.warn(`[Contrast Check] ${elementId}:`, result.error);
    return;
  }

  if (!result.passed) {
    console.warn(
      `[Contrast Check] ${elementId}: FAIL`,
      `\n  Required: ${result.requiredRatio}:1`,
      `\n  Actual: ${result.contrastRatio}:1`,
      `\n  Text: ${textColor}`,
      `\n  Background: ${backgroundColor}`,
      `\n  Large Text: ${isLargeText}`,
    );
  } else if (process.env.NODE_ENV === 'development') {
    console.log(
      `[Contrast Check] ${elementId}: PASS`,
      `(${result.contrastRatio}:1)`,
    );
  }
}

/**
 * Common color values from the design system
 * Use these as reference when checking contrast
 */
export const DESIGN_COLORS = {
  // Text colors on dark backgrounds
  textOnDark: 'rgba(248, 244, 238, 0.95)', // --kc-text-on-dark
  textOnDarkMuted: 'rgba(248, 244, 238, 0.8)', // --kc-text-on-dark-muted
  textOnDarkSubtle: 'rgba(248, 244, 238, 0.7)', // --kc-text-on-dark-subtle

  // Text colors on light backgrounds
  textOnLight: 'rgba(27, 27, 27, 0.92)', // --kc-text-on-light
  textOnLightMuted: 'rgba(27, 27, 27, 0.85)', // --kc-text-on-light-muted

  // Background colors
  navy900: '#0F1B2A', // --kc-navy-900
  navy700: '#1C2D48', // --kc-navy-700
  cream100: '#F8F4EE', // --kc-cream-100
  creamHero: '#F5E6D3', // --kc-cream-hero

  // Hero gradient stops
  heroStart: '#F5E6D3',
  heroMid: '#E8D5C4',
  heroEnd: '#D4C4B0',
};

// Example usage:
// logContrastWarning(
//   'Footer description text',
//   DESIGN_COLORS.textOnDark,
//   DESIGN_COLORS.navy900
// );

