interface RecipeSearchConditionsProps {
  conditions?: {
    selectedDonuts: string[]
    slots: number
    berryCount: number
  }
  hasResults: boolean
}

export function RecipeSearchConditions({
  conditions,
  hasResults,
}: RecipeSearchConditionsProps) {
  if (!conditions || !hasResults) {
    return null
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm">
      <h3 className="font-semibold text-gray-700 mb-2">検索条件</h3>
      <div className="space-y-1 text-gray-600">
        <div>
          <span className="font-medium">選択ドーナツ:</span>{' '}
          {conditions.selectedDonuts.join('、')}
        </div>
        <div>
          <span className="font-medium">スロット数:</span> {conditions.slots}
        </div>
        <div>
          <span className="font-medium">使用可能きのみ:</span> {conditions.berryCount}種類
        </div>
      </div>
    </div>
  )
}
