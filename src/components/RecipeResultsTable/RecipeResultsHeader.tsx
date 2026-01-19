interface RecipeResultsHeaderProps {
  hasResults: boolean
  onDownloadCSV: () => void
}

export function RecipeResultsHeader({
  hasResults,
  onDownloadCSV,
}: RecipeResultsHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-semibold">レシピ検索結果</h2>
      {hasResults && (
        <button
          type="button"
          onClick={onDownloadCSV}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors flex items-center gap-2"
          title="レシピをCSVファイルとしてダウンロード"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <title>ダウンロード</title>
            <path
              fillRule="evenodd"
              d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
          CSVダウンロード
        </button>
      )}
    </div>
  )
}
