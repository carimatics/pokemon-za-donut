import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useMediaQuery, useIsMobile, useIsTablet, useIsDesktop, BREAKPOINTS } from '../useMediaQuery'

describe('useMediaQuery', () => {
  let matchMediaMock: {
    matches: boolean
    media: string
    addEventListener: ReturnType<typeof vi.fn>
    removeEventListener: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    matchMediaMock = {
      matches: false,
      media: '',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }

    // Mock window.matchMedia
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      ...matchMediaMock,
      media: query,
    }))
  })

  it('should return false initially when media query does not match', () => {
    matchMediaMock.matches = false
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))
    expect(result.current).toBe(false)
  })

  it('should return true initially when media query matches', () => {
    matchMediaMock.matches = true
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))
    expect(result.current).toBe(true)
  })

  it('should update when media query match changes', () => {
    matchMediaMock.matches = false
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))

    expect(result.current).toBe(false)

    // Simulate media query change
    act(() => {
      const changeHandler = matchMediaMock.addEventListener.mock.calls.find(
        call => call[0] === 'change'
      )?.[1]
      if (changeHandler) {
        changeHandler({ matches: true } as MediaQueryListEvent)
      }
    })

    expect(result.current).toBe(true)
  })

  it('should add event listener on mount', () => {
    renderHook(() => useMediaQuery('(min-width: 768px)'))
    expect(matchMediaMock.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it('should remove event listener on unmount', () => {
    const { unmount} = renderHook(() => useMediaQuery('(min-width: 768px)'))
    unmount()
    expect(matchMediaMock.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })
})

describe('BREAKPOINTS', () => {
  it('should have correct breakpoint values', () => {
    expect(BREAKPOINTS.SM).toBe('(min-width: 640px)')
    expect(BREAKPOINTS.MD).toBe('(min-width: 768px)')
    expect(BREAKPOINTS.LG).toBe('(min-width: 1024px)')
    expect(BREAKPOINTS.XL).toBe('(min-width: 1280px)')
    expect(BREAKPOINTS['2XL']).toBe('(min-width: 1536px)')
  })
})

describe('useIsMobile', () => {
  it('should return true when viewport is less than 768px', () => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false, // MD breakpoint doesn't match
      media: '',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('should return false when viewport is 768px or more', () => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: true, // MD breakpoint matches
      media: '',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })
})

describe('useIsTablet', () => {
  it('should return true when viewport is between 768px and 1024px', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === BREAKPOINTS.MD, // MD matches, LG doesn't
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))

    const { result } = renderHook(() => useIsTablet())
    expect(result.current).toBe(true)
  })

  it('should return false when viewport is less than 768px', () => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false, // Neither MD nor LG matches
      media: '',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))

    const { result } = renderHook(() => useIsTablet())
    expect(result.current).toBe(false)
  })

  it('should return false when viewport is 1024px or more', () => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: true, // Both MD and LG match
      media: '',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))

    const { result } = renderHook(() => useIsTablet())
    expect(result.current).toBe(false)
  })
})

describe('useIsDesktop', () => {
  it('should return true when viewport is 1024px or more', () => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: true, // LG breakpoint matches
      media: '',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))

    const { result } = renderHook(() => useIsDesktop())
    expect(result.current).toBe(true)
  })

  it('should return false when viewport is less than 1024px', () => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false, // LG breakpoint doesn't match
      media: '',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))

    const { result } = renderHook(() => useIsDesktop())
    expect(result.current).toBe(false)
  })
})
