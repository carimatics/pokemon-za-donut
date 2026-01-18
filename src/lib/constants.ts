/**
 * Storage keys for localStorage persistence
 */
export const STORAGE_KEYS = {
  SELECTED_DONUTS: 'pokemon-za-selected-donuts',
  BERRY_STOCKS: 'pokemon-za-berry-stocks',
  SLOTS: 'pokemon-za-slots',
} as const

/**
 * Default values for application state
 */
export const DEFAULT_VALUES = {
  SLOTS: 8,
  MAX_SOLUTIONS: 10000,
  DEBOUNCE_DELAY: 300,
  TOAST_DURATION: 5000,
} as const

/**
 * Tab values
 */
export const TAB_VALUES = {
  DONUTS: 'donuts',
  BERRIES: 'berries',
  RESULTS: 'results',
} as const

export type TabValue = typeof TAB_VALUES[keyof typeof TAB_VALUES]
