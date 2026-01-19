import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, vi } from 'vitest'

// Suppress console output during tests
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
}

beforeAll(() => {
  // Mock console methods to suppress noisy output
  // Allow error logs through for debugging failed tests
  console.log = vi.fn()
  console.warn = vi.fn()
  // Keep console.error for debugging but filter out expected errors
  console.error = vi.fn((...args: unknown[]) => {
    const message = String(args[0])
    // Only show unexpected errors
    if (!message.includes('[WebGPU]') &&
        !message.includes('[TypeGPU]') &&
        !message.includes('[EnhancedRecipeFinder]')) {
      originalConsole.error(...args)
    }
  })
})

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock matchMedia for tests that use useMediaQuery
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})
