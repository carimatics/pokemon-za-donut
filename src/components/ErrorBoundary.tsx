import { useRouter } from '@tanstack/react-router'

interface ErrorBoundaryProps {
  error: Error
  reset?: () => void
}

/**
 * Error boundary component for displaying error states
 * Used with TanStack Router's errorComponent option
 */
export function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  const router = useRouter()

  const handleReset = () => {
    if (reset) {
      reset()
    } else {
      // Navigate back to home
      router.navigate({ to: '/pokemon-za-donut' })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 space-y-4">
        <div className="flex items-center gap-3">
          <svg
            className="h-8 w-8 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <title>エラー</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 className="text-xl font-bold text-gray-900">
            エラーが発生しました
          </h2>
        </div>

        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-sm font-medium text-red-800 mb-2">
            エラー詳細:
          </p>
          <pre className="text-xs text-red-700 overflow-auto whitespace-pre-wrap break-all">
            {error.message}
          </pre>
        </div>

        {error.stack && (
          <details className="bg-gray-50 border border-gray-200 rounded p-4">
            <summary className="text-sm font-medium text-gray-700 cursor-pointer">
              スタックトレース
            </summary>
            <pre className="mt-2 text-xs text-gray-600 overflow-auto whitespace-pre-wrap break-all">
              {error.stack}
            </pre>
          </details>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors font-medium"
          >
            ホームに戻る
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition-colors font-medium"
          >
            ページを再読み込み
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center">
          問題が解決しない場合は、ブラウザのキャッシュをクリアしてください。
        </p>
      </div>
    </div>
  )
}
