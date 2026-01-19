import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Toast } from '../Toast'

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Rendering', () => {
    it('should render with default variant (error)', () => {
      const onClose = vi.fn()
      render(<Toast message="Test message" onClose={onClose} />)

      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('Test message')).toBeInTheDocument()
      expect(screen.getByTitle('エラー')).toBeInTheDocument()
    })

    it('should render with error variant', () => {
      const onClose = vi.fn()
      render(<Toast message="Error message" variant="error" onClose={onClose} />)

      expect(screen.getByText('Error message')).toBeInTheDocument()
      expect(screen.getByTitle('エラー')).toBeInTheDocument()
    })

    it('should render with success variant', () => {
      const onClose = vi.fn()
      render(<Toast message="Success message" variant="success" onClose={onClose} />)

      expect(screen.getByText('Success message')).toBeInTheDocument()
      expect(screen.getByTitle('成功')).toBeInTheDocument()
    })

    it('should render with info variant', () => {
      const onClose = vi.fn()
      render(<Toast message="Info message" variant="info" onClose={onClose} />)

      expect(screen.getByText('Info message')).toBeInTheDocument()
      expect(screen.getByTitle('情報')).toBeInTheDocument()
    })

    it('should render multiline messages', () => {
      const onClose = vi.fn()
      const message = 'Line 1\nLine 2\nLine 3'
      render(<Toast message={message} onClose={onClose} />)

      // Use a flexible matcher for multiline text
      expect(screen.getByText((_content, element) => {
        return element?.textContent === message
      })).toBeInTheDocument()
    })

    it('should render close button', () => {
      const onClose = vi.fn()
      render(<Toast message="Test message" onClose={onClose} />)

      const closeButton = screen.getByLabelText('閉じる')
      expect(closeButton).toBeInTheDocument()
      expect(closeButton.tagName).toBe('BUTTON')
    })
  })

  describe('Auto-close functionality', () => {
    it('should auto-close after default duration (5000ms)', () => {
      const onClose = vi.fn()
      render(<Toast message="Test message" onClose={onClose} />)

      expect(onClose).not.toHaveBeenCalled()

      vi.advanceTimersByTime(5000)

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should auto-close after custom duration', () => {
      const onClose = vi.fn()
      render(<Toast message="Test message" onClose={onClose} duration={3000} />)

      expect(onClose).not.toHaveBeenCalled()

      vi.advanceTimersByTime(2999)
      expect(onClose).not.toHaveBeenCalled()

      vi.advanceTimersByTime(1)
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should not auto-close when duration is 0', () => {
      const onClose = vi.fn()
      render(<Toast message="Test message" onClose={onClose} duration={0} />)

      vi.advanceTimersByTime(10000)

      expect(onClose).not.toHaveBeenCalled()
    })

    it('should not auto-close when duration is negative', () => {
      const onClose = vi.fn()
      render(<Toast message="Test message" onClose={onClose} duration={-1} />)

      vi.advanceTimersByTime(10000)

      expect(onClose).not.toHaveBeenCalled()
    })

    it('should clear timer on unmount', () => {
      const onClose = vi.fn()
      const { unmount } = render(<Toast message="Test message" onClose={onClose} />)

      unmount()
      vi.advanceTimersByTime(5000)

      expect(onClose).not.toHaveBeenCalled()
    })

    it('should update timer when duration changes', () => {
      const onClose = vi.fn()
      const { rerender } = render(<Toast message="Test message" onClose={onClose} duration={3000} />)

      vi.advanceTimersByTime(2000)

      // Change duration
      rerender(<Toast message="Test message" onClose={onClose} duration={5000} />)

      // Original timer should be cleared, new timer should start
      vi.advanceTimersByTime(3000) // Total 5000ms from rerender
      expect(onClose).not.toHaveBeenCalled()

      vi.advanceTimersByTime(2000) // Complete the 5000ms
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Manual close', () => {
    it('should call onClose when close button is clicked', async () => {
      vi.useRealTimers() // Use real timers for user interactions
      const user = userEvent.setup()
      const onClose = vi.fn()
      render(<Toast message="Test message" onClose={onClose} />)

      const closeButton = screen.getByLabelText('閉じる')
      await user.click(closeButton)

      expect(onClose).toHaveBeenCalledTimes(1)
      vi.useFakeTimers() // Restore fake timers
    })

    it('should allow manual close before auto-close timer', async () => {
      vi.useRealTimers() // Use real timers for user interactions
      const user = userEvent.setup()
      const onClose = vi.fn()
      render(<Toast message="Test message" onClose={onClose} duration={10000} />)

      // Click close before auto-close triggers
      const closeButton = screen.getByLabelText('閉じる')
      await user.click(closeButton)

      expect(onClose).toHaveBeenCalledTimes(1)
      vi.useFakeTimers() // Restore fake timers
    })
  })

  describe('Accessibility', () => {
    it('should have role="alert"', () => {
      const onClose = vi.fn()
      render(<Toast message="Test message" onClose={onClose} />)

      const alert = screen.getByRole('alert')
      expect(alert).toBeInTheDocument()
    })

    it('should have aria-live="assertive"', () => {
      const onClose = vi.fn()
      render(<Toast message="Test message" onClose={onClose} />)

      const alert = screen.getByRole('alert')
      expect(alert).toHaveAttribute('aria-live', 'assertive')
    })

    it('should have accessible close button', () => {
      const onClose = vi.fn()
      render(<Toast message="Test message" onClose={onClose} />)

      const closeButton = screen.getByLabelText('閉じる')
      expect(closeButton).toHaveAttribute('type', 'button')
      expect(closeButton).toHaveAttribute('aria-label', '閉じる')
    })

    it('should have title attributes on icons', () => {
      const onClose = vi.fn()

      const { rerender } = render(<Toast message="Test" variant="error" onClose={onClose} />)
      expect(screen.getByTitle('エラー')).toBeInTheDocument()

      rerender(<Toast message="Test" variant="success" onClose={onClose} />)
      expect(screen.getByTitle('成功')).toBeInTheDocument()

      rerender(<Toast message="Test" variant="info" onClose={onClose} />)
      expect(screen.getByTitle('情報')).toBeInTheDocument()
    })

    it('should have title on close button icon', () => {
      const onClose = vi.fn()
      render(<Toast message="Test message" onClose={onClose} />)

      expect(screen.getByTitle('閉じる')).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('should apply error variant styles', () => {
      const onClose = vi.fn()
      const { container } = render(<Toast message="Test" variant="error" onClose={onClose} />)

      const alert = container.querySelector('[role="alert"]')
      expect(alert).toHaveClass('bg-red-500', 'text-white')
    })

    it('should apply success variant styles', () => {
      const onClose = vi.fn()
      const { container } = render(<Toast message="Test" variant="success" onClose={onClose} />)

      const alert = container.querySelector('[role="alert"]')
      expect(alert).toHaveClass('bg-green-500', 'text-white')
    })

    it('should apply info variant styles', () => {
      const onClose = vi.fn()
      const { container } = render(<Toast message="Test" variant="info" onClose={onClose} />)

      const alert = container.querySelector('[role="alert"]')
      expect(alert).toHaveClass('bg-blue-500', 'text-white')
    })

    it('should have fixed positioning and z-index', () => {
      const onClose = vi.fn()
      const { container } = render(<Toast message="Test" onClose={onClose} />)

      const alert = container.querySelector('[role="alert"]')
      expect(alert).toHaveClass('fixed', 'z-50')
    })

    it('should have animation class', () => {
      const onClose = vi.fn()
      const { container } = render(<Toast message="Test" onClose={onClose} />)

      const alert = container.querySelector('[role="alert"]')
      expect(alert).toHaveClass('animate-slide-up')
    })
  })

  describe('Edge cases', () => {
    it('should handle empty message', () => {
      const onClose = vi.fn()
      render(<Toast message="" onClose={onClose} />)

      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('should handle very long messages', () => {
      const onClose = vi.fn()
      const longMessage = 'A'.repeat(1000)
      render(<Toast message={longMessage} onClose={onClose} />)

      expect(screen.getByText(longMessage)).toBeInTheDocument()
    })

    it('should handle special characters in message', () => {
      const onClose = vi.fn()
      const specialMessage = '<script>alert("xss")</script>'
      render(<Toast message={specialMessage} onClose={onClose} />)

      // React should escape the content
      expect(screen.getByText(specialMessage)).toBeInTheDocument()
    })

    it('should handle multiple toasts rendered simultaneously', () => {
      const onClose1 = vi.fn()
      const onClose2 = vi.fn()
      const onClose3 = vi.fn()

      const { container } = render(
        <>
          <Toast message="Toast 1" onClose={onClose1} />
          <Toast message="Toast 2" onClose={onClose2} />
          <Toast message="Toast 3" onClose={onClose3} />
        </>
      )

      const alerts = container.querySelectorAll('[role="alert"]')
      expect(alerts).toHaveLength(3)
      expect(screen.getByText('Toast 1')).toBeInTheDocument()
      expect(screen.getByText('Toast 2')).toBeInTheDocument()
      expect(screen.getByText('Toast 3')).toBeInTheDocument()
    })
  })
})
