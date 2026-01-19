import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorBoundary } from '../ErrorBoundary'

// Mock TanStack Router
const mockNavigate = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({
    navigate: mockNavigate,
  }),
}))

describe('ErrorBoundary', () => {
  let originalLocation: typeof window.location

  beforeEach(() => {
    vi.clearAllMocks()
    originalLocation = window.location
    // @ts-expect-error - Mocking location.reload
    delete window.location
    // @ts-expect-error - Mocking location object
    window.location = { ...originalLocation, reload: vi.fn() }
  })

  afterEach(() => {
    // @ts-expect-error - Restoring location object
    window.location = originalLocation
  })

  describe('Rendering', () => {
    it('should render error message', () => {
      const error = new Error('Test error message')
      render(<ErrorBoundary error={error} />)

      expect(screen.getByText('エラーが発生しました')).toBeInTheDocument()
      expect(screen.getByText('エラー詳細:')).toBeInTheDocument()
      expect(screen.getByText('Test error message')).toBeInTheDocument()
    })

    it('should render error icon', () => {
      const error = new Error('Test error')
      const { container } = render(<ErrorBoundary error={error} />)

      // Get the SVG element (parent of title)
      const svg = container.querySelector('svg[aria-hidden="true"]')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveAttribute('aria-hidden', 'true')
    })

    it('should render action buttons', () => {
      const error = new Error('Test error')
      render(<ErrorBoundary error={error} />)

      expect(screen.getByText('ホームに戻る')).toBeInTheDocument()
      expect(screen.getByText('ページを再読み込み')).toBeInTheDocument()
    })

    it('should render help text', () => {
      const error = new Error('Test error')
      render(<ErrorBoundary error={error} />)

      expect(screen.getByText(/問題が解決しない場合は、ブラウザのキャッシュをクリアしてください。/)).toBeInTheDocument()
    })
  })

  describe('Stack trace', () => {
    it('should render stack trace when available', () => {
      const error = new Error('Test error')
      error.stack = 'Error: Test error\n    at Object.<anonymous> (test.js:1:1)'
      render(<ErrorBoundary error={error} />)

      const details = screen.getByText('スタックトレース')
      expect(details).toBeInTheDocument()
    })

    it('should not render stack trace section when not available', () => {
      const error = new Error('Test error')
      error.stack = undefined
      render(<ErrorBoundary error={error} />)

      expect(screen.queryByText('スタックトレース')).not.toBeInTheDocument()
    })

    it('should render stack trace in details element', () => {
      const error = new Error('Test error')
      error.stack = 'Error: Test error\n    at Object.<anonymous> (test.js:1:1)'
      const { container } = render(<ErrorBoundary error={error} />)

      const details = container.querySelector('details')
      expect(details).toBeInTheDocument()
      expect(within(details as HTMLElement).getByText(/Error: Test error/)).toBeInTheDocument()
    })

    it('should allow expanding stack trace details', async () => {
      const user = userEvent.setup()
      const error = new Error('Test error')
      error.stack = 'Error: Test error\n    at test.js:1:1'
      const { container } = render(<ErrorBoundary error={error} />)

      const summary = screen.getByText('スタックトレース')
      const details = container.querySelector('details')

      // Initially closed
      expect(details).not.toHaveAttribute('open')

      // Click to expand
      await user.click(summary)

      // Should be open now
      await vi.waitFor(() => {
        expect(details).toHaveAttribute('open')
      })
    })
  })

  describe('Reset functionality', () => {
    it('should call custom reset function when provided', async () => {
      const user = userEvent.setup()
      const error = new Error('Test error')
      const reset = vi.fn()
      render(<ErrorBoundary error={error} reset={reset} />)

      const resetButton = screen.getByText('ホームに戻る')
      await user.click(resetButton)

      expect(reset).toHaveBeenCalledTimes(1)
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('should navigate to home when reset function is not provided', async () => {
      const user = userEvent.setup()
      const error = new Error('Test error')
      render(<ErrorBoundary error={error} />)

      const resetButton = screen.getByText('ホームに戻る')
      await user.click(resetButton)

      expect(mockNavigate).toHaveBeenCalledTimes(1)
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/pokemon-za-donut' })
    })

    it('should have correct button type', () => {
      const error = new Error('Test error')
      render(<ErrorBoundary error={error} />)

      const resetButton = screen.getByText('ホームに戻る')
      expect(resetButton).toHaveAttribute('type', 'button')
    })
  })

  describe('Reload functionality', () => {
    it('should reload page when reload button is clicked', async () => {
      const user = userEvent.setup()
      const error = new Error('Test error')
      render(<ErrorBoundary error={error} />)

      const reloadButton = screen.getByText('ページを再読み込み')
      await user.click(reloadButton)

      expect(window.location.reload).toHaveBeenCalledTimes(1)
    })

    it('should have correct button type', () => {
      const error = new Error('Test error')
      render(<ErrorBoundary error={error} />)

      const reloadButton = screen.getByText('ページを再読み込み')
      expect(reloadButton).toHaveAttribute('type', 'button')
    })
  })

  describe('Error message formatting', () => {
    it('should handle multiline error messages', () => {
      const error = new Error('Line 1\nLine 2\nLine 3')
      const { container } = render(<ErrorBoundary error={error} />)

      // Find the error message in the error details section (not stack trace)
      const errorBox = container.querySelector('.bg-red-50')
      const pre = errorBox?.querySelector('pre')
      expect(pre?.textContent).toContain('Line 1')
      expect(pre?.textContent).toContain('Line 2')
      expect(pre?.textContent).toContain('Line 3')
    })

    it('should handle long error messages', () => {
      const error = new Error('A'.repeat(500))
      render(<ErrorBoundary error={error} />)

      expect(screen.getByText('A'.repeat(500))).toBeInTheDocument()
    })

    it('should handle special characters in error message', () => {
      const error = new Error('<script>alert("xss")</script>')
      render(<ErrorBoundary error={error} />)

      // React should escape the content
      expect(screen.getByText('<script>alert("xss")</script>')).toBeInTheDocument()
    })

    it('should handle empty error message', () => {
      const error = new Error('')
      render(<ErrorBoundary error={error} />)

      expect(screen.getByText('エラー詳細:')).toBeInTheDocument()
    })

    it('should render error message in pre tag for formatting', () => {
      const error = new Error('Test error')
      const { container } = render(<ErrorBoundary error={error} />)

      const errorDetailSection = container.querySelector('.bg-red-50')
      const pre = errorDetailSection?.querySelector('pre')
      expect(pre).toBeInTheDocument()
      expect(pre?.textContent).toBe('Test error')
    })
  })

  describe('Styling', () => {
    it('should have correct container styling', () => {
      const error = new Error('Test error')
      const { container } = render(<ErrorBoundary error={error} />)

      const outerDiv = container.firstChild
      expect(outerDiv).toHaveClass('min-h-screen', 'flex', 'items-center', 'justify-center')
    })

    it('should apply error variant colors', () => {
      const error = new Error('Test error')
      const { container } = render(<ErrorBoundary error={error} />)

      const icon = container.querySelector('svg[aria-hidden="true"]')
      expect(icon).toHaveClass('text-red-500')

      const errorBox = container.querySelector('.bg-red-50')
      expect(errorBox).toHaveClass('border-red-200')
    })

    it('should have button styling', () => {
      const error = new Error('Test error')
      render(<ErrorBoundary error={error} />)

      const resetButton = screen.getByText('ホームに戻る')
      expect(resetButton).toHaveClass('bg-blue-500', 'text-white')

      const reloadButton = screen.getByText('ページを再読み込み')
      expect(reloadButton).toHaveClass('bg-gray-200', 'text-gray-700')
    })
  })

  describe('Edge cases', () => {
    it('should handle Error without message property', () => {
      const error = new Error()
      render(<ErrorBoundary error={error} />)

      expect(screen.getByText('エラーが発生しました')).toBeInTheDocument()
    })

    it('should handle multiple rapid reset clicks', async () => {
      const user = userEvent.setup()
      const error = new Error('Test error')
      const reset = vi.fn()
      render(<ErrorBoundary error={error} reset={reset} />)

      const resetButton = screen.getByText('ホームに戻る')

      await user.click(resetButton)
      await user.click(resetButton)
      await user.click(resetButton)

      expect(reset).toHaveBeenCalledTimes(3)
    })

    it('should handle multiple rapid reload clicks', async () => {
      const user = userEvent.setup()
      const error = new Error('Test error')
      render(<ErrorBoundary error={error} />)

      const reloadButton = screen.getByText('ページを再読み込み')

      await user.click(reloadButton)
      await user.click(reloadButton)

      expect(window.location.reload).toHaveBeenCalledTimes(2)
    })

    it('should handle very long stack traces', () => {
      const error = new Error('Test error')
      error.stack = 'Error: Test error\n' + '    at test.js:1:1\n'.repeat(100)
      const { container } = render(<ErrorBoundary error={error} />)

      const details = container.querySelector('details')
      expect(details).toBeInTheDocument()

      const pre = details?.querySelector('pre')
      expect(pre).toHaveClass('overflow-auto')
    })
  })

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      const error = new Error('Test error')
      render(<ErrorBoundary error={error} />)

      expect(screen.getByRole('heading', { name: 'エラーが発生しました' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'ホームに戻る' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'ページを再読み込み' })).toBeInTheDocument()
    })

    it('should hide decorative icon from screen readers', () => {
      const error = new Error('Test error')
      const { container } = render(<ErrorBoundary error={error} />)

      const icon = container.querySelector('svg[aria-hidden="true"]')
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    })

    it('should use summary element for collapsible stack trace', () => {
      const error = new Error('Test error')
      error.stack = 'Error: Test error\n    at test.js:1:1'
      const { container } = render(<ErrorBoundary error={error} />)

      const summary = container.querySelector('summary')
      expect(summary).toBeInTheDocument()
      expect(summary).toHaveTextContent('スタックトレース')
    })

    it('should have keyboard accessible buttons', () => {
      const error = new Error('Test error')
      render(<ErrorBoundary error={error} />)

      const resetButton = screen.getByText('ホームに戻る')
      const reloadButton = screen.getByText('ページを再読み込み')

      expect(resetButton.tagName).toBe('BUTTON')
      expect(reloadButton.tagName).toBe('BUTTON')
    })
  })
})
