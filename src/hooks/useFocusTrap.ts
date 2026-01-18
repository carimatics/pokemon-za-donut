import { useEffect, useRef, type RefObject } from 'react'

interface UseFocusTrapOptions {
  /**
   * Callback to invoke when escape key is pressed
   */
  onEscape?: () => void

  /**
   * Whether the focus trap is active
   * @default true
   */
  enabled?: boolean

  /**
   * Element to focus when the trap is closed
   */
  returnFocusRef?: RefObject<HTMLElement | null>
}

/**
 * Custom hook that traps focus within a container element
 *
 * Features:
 * - Traps Tab/Shift+Tab navigation within the container
 * - Automatically focuses the first focusable element
 * - Handles Escape key to trigger onEscape callback
 * - Returns focus to the trigger element when trap is disabled
 *
 * @param containerRef - Reference to the container element
 * @param options - Configuration options
 * @returns void
 *
 * @example
 * ```tsx
 * const modalRef = useRef<HTMLDivElement>(null)
 * const returnRef = useRef<HTMLButtonElement>(null)
 *
 * useFocusTrap(modalRef, {
 *   onEscape: () => setIsOpen(false),
 *   returnFocusRef: returnRef
 * })
 * ```
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  options: UseFocusTrapOptions = {}
) {
  const { onEscape, enabled = true, returnFocusRef } = options

  // Store the element that had focus before the trap was activated
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!enabled || !containerRef.current) return

    // Save the currently focused element
    previouslyFocusedElementRef.current = document.activeElement as HTMLElement

    // Get all focusable elements within the container
    const getFocusableElements = (): HTMLElement[] => {
      if (!containerRef.current) return []

      const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(', ')

      const elements = Array.from(
        containerRef.current.querySelectorAll<HTMLElement>(focusableSelectors)
      )

      // Filter out elements that are not visible
      return elements.filter((el) => {
        return (
          el.offsetParent !== null &&
          window.getComputedStyle(el).visibility !== 'hidden' &&
          window.getComputedStyle(el).display !== 'none'
        )
      })
    }

    // Focus the first focusable element
    const focusableElements = getFocusableElements()
    if (focusableElements.length > 0) {
      focusableElements[0].focus()
    }

    // Handle keyboard events
    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle Escape key
      if (event.key === 'Escape' && onEscape) {
        event.preventDefault()
        onEscape()
        return
      }

      // Handle Tab key for focus trapping
      if (event.key === 'Tab') {
        const focusableElements = getFocusableElements()

        if (focusableElements.length === 0) {
          event.preventDefault()
          return
        }

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        // Shift+Tab: move focus backward
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault()
            lastElement.focus()
          }
        }
        // Tab: move focus forward
        else {
          if (document.activeElement === lastElement) {
            event.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    // Add event listener
    document.addEventListener('keydown', handleKeyDown)

    // Cleanup function
    return () => {
      document.removeEventListener('keydown', handleKeyDown)

      // Return focus to the element that had focus before the trap was activated
      if (returnFocusRef?.current) {
        returnFocusRef.current.focus()
      } else if (previouslyFocusedElementRef.current) {
        previouslyFocusedElementRef.current.focus()
      }
    }
  }, [containerRef, enabled, onEscape, returnFocusRef])
}
