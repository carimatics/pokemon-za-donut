import { LoadingSpinner } from './LoadingSpinner'
import { useIsMobile } from '@/hooks/useMediaQuery'

interface FloatingActionButtonProps {
  disabled: boolean
  isLoading: boolean
  onClick: () => void
}

export function FloatingActionButton({ disabled, isLoading, onClick }: FloatingActionButtonProps) {
  const isMobile = useIsMobile()

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
      className={`fixed ${
        isMobile
          ? 'bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full min-w-[200px]'
          : 'bottom-8 right-8 p-4 rounded-full'
      } bg-blue-500 text-white shadow-lg hover:bg-blue-600 active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all z-50 flex items-center justify-center gap-2`}
      title={getTitle()}
      aria-label={getTitle()}
    >
      {isLoading ? (
        <>
          <LoadingSpinner size="md" />
          {isMobile && <span className="font-medium">検索中...</span>}
        </>
      ) : (
        <>
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
          {isMobile && <span className="font-medium">レシピを検索</span>}
        </>
      )}
    </button>
  )
}
