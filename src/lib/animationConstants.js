/**
 * Animation timing constants matching CSS tokens
 * These values correspond to --kc-duration-* tokens in CSS
 * 
 * Usage in framer-motion:
 * transition={{ duration: ANIMATION_DURATIONS.md, ease: ANIMATION_EASE }}
 */

// Duration constants (in seconds for framer-motion)
export const ANIMATION_DURATIONS = {
  xs: 0.2,   // 200ms - ultra-fast transitions
  sm: 0.35,  // 350ms - matches --kc-duration-sm
  md: 0.5,   // 500ms - matches --kc-duration-md
  lg: 0.7,   // 700ms - matches --kc-duration-lg
  xl: 1.0,   // 1000ms - slow, deliberate animations
};

// Easing functions matching --kc-ease
export const ANIMATION_EASE = [0.16, 1, 0.3, 1]; // Default smooth ease
export const ANIMATION_EASE_OUT = [0.19, 1, 0.22, 1]; // Ease out for entrances
export const ANIMATION_EASE_IN = [0.4, 0, 0.2, 1]; // Ease in for exits
export const ANIMATION_EASE_IN_OUT = [0.4, 0, 0.2, 1]; // Symmetric ease

// Spring physics for natural motion
export const SPRING_CONFIG = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
  mass: 0.8,
};

// Quick spring for snappy interactions
export const SPRING_QUICK = {
  type: 'spring',
  stiffness: 400,
  damping: 25,
};

// Slow spring for smooth, deliberate motion
export const SPRING_SMOOTH = {
  type: 'spring',
  stiffness: 200,
  damping: 25,
};

