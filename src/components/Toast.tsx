import { useEffect } from 'react'

interface ToastProps {
  message: string
  variant?: 'error' | 'success' | 'info'
  onClose: () => void
  duration?: number
}

export function Toast({ message, variant = 'error', onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const variantStyles = {
    error: 'bg-red-500 text-white',
    success: 'bg-green-500 text-white',
    info: 'bg-blue-500 text-white',
  }

  const variantIcons = {
    error: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <title>エラー</title>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    success: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <title>成功</title>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <title>情報</title>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  }

  return (
    <div
      className={`fixed bottom-24 right-8 max-w-md p-4 rounded-lg shadow-lg flex items-start gap-3 z-50 animate-slide-up ${variantStyles[variant]}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex-shrink-0">{variantIcons[variant]}</div>
      <div className="flex-1 text-sm whitespace-pre-line">{message}</div>
      <button
        type="button"
        onClick={onClose}
        className="flex-shrink-0 hover:opacity-80 transition-opacity"
        aria-label="閉じる"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <title>閉じる</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  )
}
