/**
 * Centralized Framer Motion variants for consistent animations across the app
 * These variants use the animation constants for timing and easing
 */

import { ANIMATION_DURATIONS, ANIMATION_EASE, ANIMATION_EASE_OUT } from './animationConstants';

// ============================================
// PAGE TRANSITIONS
// ============================================

export const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: ANIMATION_DURATIONS.md,
      ease: ANIMATION_EASE,
      staggerChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: ANIMATION_DURATIONS.sm,
      ease: ANIMATION_EASE,
    },
  },
};

// ============================================
// MODAL / DIALOG VARIANTS
// ============================================

export const modalBackdropVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: ANIMATION_DURATIONS.sm, ease: ANIMATION_EASE },
};

export const modalContentVariants = {
  initial: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: ANIMATION_DURATIONS.md,
      ease: ANIMATION_EASE_OUT,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: {
      duration: ANIMATION_DURATIONS.sm,
      ease: ANIMATION_EASE,
    },
  },
};

export const slideInRightVariants = {
  initial: {
    x: '100%',
    opacity: 0,
  },
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      duration: ANIMATION_DURATIONS.md,
      ease: ANIMATION_EASE_OUT,
    },
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: {
      duration: ANIMATION_DURATIONS.sm,
      ease: ANIMATION_EASE,
    },
  },
};

// ============================================
// DROPDOWN / POPOVER VARIANTS
// ============================================

export const dropdownVariants = {
  initial: {
    opacity: 0,
    y: -8,
    scale: 0.96,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: ANIMATION_DURATIONS.sm,
      ease: ANIMATION_EASE_OUT,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.96,
    transition: {
      duration: ANIMATION_DURATIONS.sm * 0.7,
      ease: ANIMATION_EASE,
    },
  },
};

// ============================================
// CARD VARIANTS
// ============================================

export const cardVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: ANIMATION_DURATIONS.md,
      ease: ANIMATION_EASE,
    },
  },
  hover: {
    y: -4,
    scale: 1.01,
    transition: {
      duration: ANIMATION_DURATIONS.sm,
      ease: ANIMATION_EASE,
    },
  },
};

export const cardStaggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

// ============================================
// LIST / GRID ITEM VARIANTS
// ============================================

export const listItemVariants = {
  initial: {
    opacity: 0,
    x: -20,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: ANIMATION_DURATIONS.sm,
      ease: ANIMATION_EASE,
    },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: {
      duration: ANIMATION_DURATIONS.sm * 0.7,
      ease: ANIMATION_EASE,
    },
  },
};

export const gridItemVariants = {
  initial: {
    opacity: 0,
    y: 12,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: ANIMATION_DURATIONS.sm,
      ease: ANIMATION_EASE,
    },
  },
  hover: {
    y: -4,
    scale: 1.02,
    transition: {
      duration: ANIMATION_DURATIONS.sm,
      ease: ANIMATION_EASE,
    },
  },
};

export const gridStaggerContainer = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

// ============================================
// FADE VARIANTS
// ============================================

export const fadeInVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: ANIMATION_DURATIONS.md,
      ease: ANIMATION_EASE,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: ANIMATION_DURATIONS.sm,
      ease: ANIMATION_EASE,
    },
  },
};

export const fadeInUpVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: ANIMATION_DURATIONS.md,
      ease: ANIMATION_EASE_OUT,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: ANIMATION_DURATIONS.sm,
      ease: ANIMATION_EASE,
    },
  },
};

// ============================================
// BUTTON VARIANTS
// ============================================

export const buttonVariants = {
  hover: {
    y: -2,
    transition: {
      duration: ANIMATION_DURATIONS.sm,
      ease: ANIMATION_EASE,
    },
  },
  tap: {
    y: 0,
    scale: 0.98,
    transition: {
      duration: ANIMATION_DURATIONS.sm * 0.5,
      ease: ANIMATION_EASE,
    },
  },
};

// ============================================
// TOAST / NOTIFICATION VARIANTS
// ============================================

export const toastVariants = {
  initial: {
    opacity: 0,
    y: -20,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: ANIMATION_DURATIONS.sm,
      ease: ANIMATION_EASE_OUT,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: {
      duration: ANIMATION_DURATIONS.sm * 0.7,
      ease: ANIMATION_EASE,
    },
  },
};

// ============================================
// IMAGE / GALLERY VARIANTS
// ============================================

export const imageVariants = {
  initial: {
    opacity: 0,
    scale: 1.05,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: ANIMATION_DURATIONS.md,
      ease: ANIMATION_EASE,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: ANIMATION_DURATIONS.sm,
      ease: ANIMATION_EASE,
    },
  },
};

// ============================================
// TAB / PANEL VARIANTS
// ============================================

export const tabPanelVariants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: ANIMATION_DURATIONS.sm,
      ease: ANIMATION_EASE,
    },
  },
  exit: {
    opacity: 0,
    y: -5,
    transition: {
      duration: ANIMATION_DURATIONS.sm * 0.7,
      ease: ANIMATION_EASE,
    },
  },
};

// ============================================
// SKELETON / LOADING VARIANTS
// ============================================

export const skeletonVariants = {
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// ============================================
// HERO / BANNER VARIANTS
// ============================================

export const heroVariants = {
  initial: {
    opacity: 0,
    y: 30,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: ANIMATION_DURATIONS.lg,
      ease: ANIMATION_EASE_OUT,
      staggerChildren: 0.1,
    },
  },
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Creates a stagger container variant with custom delay
 */
export const createStaggerContainer = (delay = 0.05, initialDelay = 0.1) => ({
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: delay,
      delayChildren: initialDelay,
    },
  },
});

/**
 * Creates a fade-in variant with custom duration
 */
export const createFadeIn = (duration = ANIMATION_DURATIONS.md, delay = 0) => ({
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration,
      delay,
      ease: ANIMATION_EASE,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: ANIMATION_DURATIONS.sm,
      ease: ANIMATION_EASE,
    },
  },
});

