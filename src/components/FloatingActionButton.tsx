import { LoadingSpinner } from './LoadingSpinner'

interface FloatingActionButtonProps {
  disabled: boolean
  isLoading: boolean
  onClick: () => void
}

export function FloatingActionButton({ disabled, isLoading, onClick }: FloatingActionButtonProps) {
  const getTitle = () => {
    if (isLoading) return '検索中...'
    if (disabled) return 'ドーナツを選択してください'
    return 'レシピを検索'
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      className="fixed bottom-8 right-8 bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors z-50"
      title={getTitle()}
      aria-label={getTitle()}
    >
      {isLoading ? (
        <LoadingSpinner size="md" />
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-6 h-6"
          aria-hidden="true"
        >
          <title>検索</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
      )}
    </button>
  )
}
