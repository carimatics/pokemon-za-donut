interface RecipeResultsSummaryProps {
  resultCount: number
  searchTime: number | null | undefined
}

export function RecipeResultsSummary({
  resultCount,
  searchTime,
}: RecipeResultsSummaryProps) {
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
