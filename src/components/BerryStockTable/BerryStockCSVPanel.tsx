interface BerryStockCSVPanelProps {
  csvText: string
  onCsvTextChange: (text: string) => void
  onExport: () => void
  onImport: () => void
}

export function BerryStockCSVPanel({
  csvText,
  onCsvTextChange,
  onExport,
  onImport,
}: BerryStockCSVPanelProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label htmlFor="csv-input" className="block font-medium">
          CSV形式でインポート/エクスポート
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onExport}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors text-sm"
            title="現在のテーブルの状態をCSVに出力"
          >
            エクスポート
          </button>
          <button
            type="button"
            onClick={onImport}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors text-sm"
            title="CSVの内容をテーブルに反映"
          >
            インポート
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-600">
        形式: <code className="bg-gray-100 px-1 rounded">berryId,count</code>
      </p>
      {/* biome-ignore lint/correctness/useUniqueElementIds: single instance per route */}
      <textarea
        id="csv-input"
        value={csvText}
        onChange={(e) => onCsvTextChange(e.target.value)}
        className="w-full border rounded px-3 py-2 font-mono text-sm min-h-[150px] focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="berryId,count&#10;oran-berry,10&#10;pecha-berry,5"
        aria-label="CSV形式でのきのみ在庫データ"
      />
    </div>
  )
}
