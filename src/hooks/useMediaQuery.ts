import { useState, useEffect } from 'react'

/**
 * Custom hook for responsive design with media queries
 * @param query - CSS media query string (e.g., '(max-width: 768px)')
 * @returns boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    // SSR-safe initialization
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)

    // Update state when media query changes
    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches)
    }

    // Set initial value
    setMatches(mediaQuery.matches)

    // Add listener (using addEventListener for better browser support)
    mediaQuery.addEventListener('change', handleChange)

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [query])

  return matches
}

/**
 * Predefined breakpoints following Tailwind CSS conventions
 */
export const BREAKPOINTS = {
  SM: '(min-width: 640px)',
  MD: '(min-width: 768px)',
  LG: '(min-width: 1024px)',
  XL: '(min-width: 1280px)',
  '2XL': '(min-width: 1536px)',
} as const

/**
 * Convenience hooks for common breakpoints
 */
export function useIsMobile() {
  return !useMediaQuery(BREAKPOINTS.MD) // < 768px
}

export function useIsTablet() {
  const isMd = useMediaQuery(BREAKPOINTS.MD)
  const isLg = useMediaQuery(BREAKPOINTS.LG)
  return isMd && !isLg // 768px - 1024px
}

export function useIsDesktop() {
  return useMediaQuery(BREAKPOINTS.LG) // >= 1024px
}
