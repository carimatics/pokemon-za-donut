interface BerryStockFiltersProps {
  hyperFilter: 'all' | 'true' | 'false'
  onHyperFilterChange: (filter: 'all' | 'true' | 'false') => void
  searchText: string
  onSearchTextChange: (text: string) => void
}

export function BerryStockFilters({
  hyperFilter,
  onHyperFilterChange,
  searchText,
  onSearchTextChange,
}: BerryStockFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex gap-2 items-center">
        <label className="font-medium" htmlFor="hyper-filter">
          きのみ種別:
        </label>
        {/* biome-ignore lint/correctness/useUniqueElementIds: single instance per route */}
        <select
          id="hyper-filter"
          value={hyperFilter}
          onChange={(e) =>
            onHyperFilterChange(e.target.value as 'all' | 'true' | 'false')
          }
          className="border rounded px-2 py-1"
        >
          <option value="all">すべて</option>
          <option value="true">異次元のみ</option>
          <option value="false">通常のみ</option>
        </select>
      </div>

      <div className="flex gap-2 items-center flex-1">
        <label className="font-medium" htmlFor="search-input">
          Search:
        </label>
        {/* biome-ignore lint/correctness/useUniqueElementIds: single instance per route */}
        <input
          id="search-input"
          type="text"
          value={searchText}
          onChange={(e) => onSearchTextChange(e.target.value)}
          placeholder="Search by name or ID..."
          className="border rounded px-3 py-1 flex-1 max-w-md"
        />
      </div>
    </div>
  )
}
