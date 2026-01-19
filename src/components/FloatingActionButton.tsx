import { useIsMobile } from '@/hooks/useMediaQuery'

interface FloatingActionButtonProps {
  disabled: boolean
  isLoading: boolean
  onClick: () => void
  onCancel?: () => void
}

export function FloatingActionButton({
  disabled,
  isLoading,
  onClick,
  onCancel
}: FloatingActionButtonProps) {
  const isMobile = useIsMobile()

  const getTitle = () => {
    if (isLoading) return 'クリックでキャンセル'
    if (disabled) return 'ドーナツを選択してください'
    return 'レシピを検索'
  }

  const handleClick = () => {
    if (isLoading && onCancel) {
      onCancel()
    } else {
      onClick()
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled && !isLoading}
      className={`fixed ${
        isMobile
          ? 'bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full min-w-[200px]'
          : 'bottom-8 right-8 p-4 rounded-full'
      } ${
        isLoading
          ? 'bg-red-500 hover:bg-red-600'
          : 'bg-blue-500 hover:bg-blue-600'
      } text-white shadow-lg active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all z-50 flex items-center justify-center gap-2`}
      title={getTitle()}
      aria-label={getTitle()}
    >
      {isLoading ? (
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
            <title>キャンセル</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          {isMobile && <span className="font-medium">キャンセル</span>}
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
