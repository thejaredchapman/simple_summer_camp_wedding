// =============================================================================
// APPLICATION CONSTANTS
// =============================================================================

// Hero carousel configuration
export const HERO_CAROUSEL_INTERVAL_MS = 5000; // Time between photo transitions
export const HERO_SCROLL_THRESHOLD_PX = 50; // Scroll position to trigger navbar style change

// API configuration
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Chat configuration
export const MAX_MESSAGE_LENGTH = 2000;
export const MAX_CONVERSATION_HISTORY = 10;

// Animation timings
export const ANIMATION_DURATION_MS = 300;
export const SCROLL_REVEAL_THRESHOLD = 0.1; // Intersection observer threshold

// Photo gallery configuration
export const GALLERY_COLUMNS = {
  mobile: 2,
  tablet: 3,
  desktop: 4
};

// Breakpoints (matching CSS)
export const BREAKPOINTS = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
  wide: 1200
};
