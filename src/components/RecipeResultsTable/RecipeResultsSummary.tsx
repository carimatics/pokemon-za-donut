interface RecipeResultsSummaryProps {
  resultCount: number
  searchTime: number | null | undefined
  isSearching?: boolean
}

export function RecipeResultsSummary({
  resultCount,
  searchTime,
  isSearching = false,
}: RecipeResultsSummaryProps) {
  // Show loading state when searching
  if (isSearching) {
    return (
      <div className="flex items-center gap-2 text-sm text-blue-600">
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span className="font-medium">計算中...</span>
      </div>
    )
  }

  if (resultCount === 0 || searchTime === null || searchTime === undefined) {
    return null
  }

  return (
    <div className="text-sm text-gray-600">
      <span className="font-medium">{resultCount.toLocaleString()}</span> 件の結果を
      <span className="font-medium"> {searchTime.toFixed(3)}</span> 秒で計算しました
    </div>
  )
}
