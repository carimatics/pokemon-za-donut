/**
 * Application Logger
 *
 * Provides environment-aware logging functionality.
 * - Development: All logs are output to console
 * - Production: Only errors and warnings are output
 * - Test: All logs are suppressed
 */

const isDev = import.meta.env.DEV
const isTest = import.meta.env.MODE === 'test'

export type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug'

export interface Logger {
  log: (...args: unknown[]) => void
  info: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
  debug: (...args: unknown[]) => void
}

/**
 * Create a namespaced logger
 * @param namespace - Logger namespace (e.g., 'EnhancedRecipeFinder', 'ParallelFinder')
 */
export function createLogger(namespace: string): Logger {
  const prefix = `[${namespace}]`

  return {
    log: (...args: unknown[]) => {
      if (isDev && !isTest) {
        console.log(prefix, ...args)
      }
    },

    info: (...args: unknown[]) => {
      if (isDev && !isTest) {
        console.info(prefix, ...args)
      }
    },

    warn: (...args: unknown[]) => {
      if (!isTest) {
        console.warn(prefix, ...args)
      }
    },

    error: (...args: unknown[]) => {
      if (!isTest) {
        console.error(prefix, ...args)
      }
    },

    debug: (...args: unknown[]) => {
      if (isDev && !isTest) {
        console.debug(prefix, ...args)
      }
    },
  }
}

/**
 * Default logger without namespace
 */
export const logger = createLogger('App')

/**
 * Performance timing helper
 * @param label - Timer label
 * @returns Function to end the timer and log the elapsed time
 */
export function createTimer(label: string) {
  const startTime = performance.now()

  return {
    end: (loggerInstance: Logger = logger) => {
      const endTime = performance.now()
      const elapsed = (endTime - startTime).toFixed(2)
      loggerInstance.log(`${label} took ${elapsed}ms`)
      return endTime - startTime
    },
  }
}
