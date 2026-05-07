/**
 * Application-wide constants
 * Centralized location for magic numbers and configuration values
 */

// Video Wall Configuration
export const VIDEO_WALL = {
  TILES_PER_PAGE: 20,
  GRID_COLUMNS: 4,
  GRID_ROWS: 5,
  MAX_CHURCHES: 60,
  POLLING_INTERVAL_MS: 5000, // 5 seconds
  SUBSCRIPTION_CHECK_INTERVAL_MS: 5000, // 5 seconds
} as const;

// Video Quality Settings
export const VIDEO_QUALITY = {
  PROFILES: {
    SLOW_2G: {
      width: 120,
      height: 90,
      frameRate: 4,
      bitrate: 200000, // 200 Kbps
    },
    "2G": {
      width: 160,
      height: 120,
      frameRate: 6,
      bitrate: 200000,
    },
    "3G": {
      width: 240,
      height: 180,
      frameRate: 8,
      bitrate: 400000, // 400 Kbps
    },
    "4G": {
      width: 240,
      height: 180,
      frameRate: 8,
      bitrate: 400000,
    },
  },
  TARGET_BANDWIDTH_KBPS: 400,
  LOW_QUALITY_THRESHOLD: 50, // Network quality score
  POOR_NETWORK_BITRATE: 150000, // 150 Kbps
} as const;

// Admin Dashboard
export const DASHBOARD = {
  STATS_UPDATE_INTERVAL_MS: 30000, // 30 seconds
  RECENT_ACTIVITY_LIMIT: 5,
} as const;

// Analytics
export const ANALYTICS = {
  MAX_EVENTS_STORED: 100,
  EVENT_RETENTION_DAYS: 7,
} as const;

// Timeouts
export const TIMEOUTS = {
  VIDEO_LOADING_MS: 10000, // 10 seconds
  RECONNECTION_DELAY_MS: 5000, // 5 seconds
} as const;

// Form Validation
export const VALIDATION = {
  SESSION_CODE_LENGTH: 6,
  CHURCH_NAME_MIN_LENGTH: 2,
  CHURCH_NAME_MAX_LENGTH: 100,
} as const;

// Rate Limiting (defined in rate-limit.ts but exposed here for reference)
export const RATE_LIMITS = {
  AUTH: {
    WINDOW_MS: 5 * 60 * 1000, // 5 minutes
    MAX_REQUESTS: 10,
  },
  API: {
    WINDOW_MS: 60 * 1000, // 1 minute
    MAX_REQUESTS: 150,
  },
  SESSION: {
    WINDOW_MS: 2 * 60 * 1000, // 2 minutes
    MAX_REQUESTS: 15,
  },
  CHURCH: {
    WINDOW_MS: 60 * 1000, // 1 minute
    MAX_REQUESTS: 30,
  },
} as const;

// UI Breakpoints (matching Tailwind defaults)
export const BREAKPOINTS = {
  XS: '375px',
  SM: '640px',
  MD: '768px',
  LG: '1024px',
  XL: '1280px',
  '2XL': '1536px',
} as const;

// Spacing scale (in pixels)
export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 16,
  LG: 24,
  XL: 32,
  '2XL': 48,
  '3XL': 64,
} as const;
