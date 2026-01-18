import { useMemo, useState, useEffect } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table'
import type { Berry } from '@/lib/types'
import { berryStocksToCSV, csvToBerryStocks } from '@/lib/csv'
import { BerryStockInput } from './BerryStockInput'
import { useIsMobile } from '@/hooks/useMediaQuery'

interface BerryStockTableProps {
  filteredBerries: Berry[]
  berryStocks: Record<string, number>
  onStockChange: (berryId: string, count: number) => void
  onResetStocks: () => void
  hyperFilter: 'all' | 'true' | 'false'
  onHyperFilterChange: (filter: 'all' | 'true' | 'false') => void
  searchText: string
  onSearchTextChange: (text: string) => void
}

export function BerryStockTable({
  filteredBerries,
  berryStocks,
  onStockChange,
  onResetStocks,
  hyperFilter,
  onHyperFilterChange,
  searchText,
  onSearchTextChange,
}: BerryStockTableProps) {
  const isMobile = useIsMobile()

  // CSV state
  const [csvText, setCsvText] = useState('')

  // Local search input state for IME support
  const [localSearchText, setLocalSearchText] = useState(searchText)

  // Sync local state with prop when it changes externally (e.g., from URL)
  useEffect(() => {
    setLocalSearchText(searchText)
  }, [searchText])

  // Handle CSV export
  const handleExport = () => {
    setCsvText(berryStocksToCSV(berryStocks))
  }

  // Handle CSV import
  const handleImport = () => {
    const importedStocks = csvToBerryStocks(csvText)

    // Reset all stocks to 0 first
    const allBerryIds = Object.keys(berryStocks)
    for (const berryId of allBerryIds) {
      onStockChange(berryId, 0)
    }

    // Update all berry stocks based on imported CSV
    for (const [berryId, count] of Object.entries(importedStocks)) {
      onStockChange(berryId, count)
    }
  }

  // Define columns for react-table
  // Optimized: Only depends on onStockChange, not berryStocks
  const columns = useMemo<ColumnDef<Berry>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: info => info.getValue(),
      },
      {
        accessorKey: 'id',
        header: 'ID',
        cell: info => <span className="text-gray-500">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'level',
        header: 'Level',
        cell: info => info.getValue(),
      },
      {
        accessorKey: 'calories',
        header: 'Calories',
        cell: info => info.getValue(),
      },
      {
        accessorKey: 'flavors.sweet',
        header: 'Sweet',
        cell: info => info.row.original.flavors.sweet,
      },
      {
        accessorKey: 'flavors.spicy',
        header: 'Spicy',
        cell: info => info.row.original.flavors.spicy,
      },
      {
        accessorKey: 'flavors.sour',
        header: 'Sour',
        cell: info => info.row.original.flavors.sour,
      },
      {
        accessorKey: 'flavors.bitter',
        header: 'Bitter',
        cell: info => info.row.original.flavors.bitter,
      },
      {
        accessorKey: 'flavors.fresh',
        header: 'Fresh',
        cell: info => info.row.original.flavors.fresh,
      },
      {
        accessorKey: 'hyper',
        header: '異次元',
        cell: info => (info.getValue() ? '✔︎' : ''),
      },
      {
        id: 'stock',
        header: '個数',
        cell: info => {
          const berry = info.row.original
          return (
            <BerryStockInput
              berry={berry}
              value={berryStocks[berry.id] || 0}
              onChange={onStockChange}
            />
          )
        },
      },
    ],
    [onStockChange, berryStocks]
  )

  // Create berry table instance
  const table = useReactTable({
    data: filteredBerries,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    // biome-ignore lint/correctness/useUniqueElementIds: single instance per route
    <section
      className="space-y-4"
      role="tabpanel"
      id="berries-panel"
      aria-labelledby="berries-tab"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">きのみ個数入力</h2>
        <button
          type="button"
          onClick={onResetStocks}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
        >
          すべてリセット
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2 items-center">
          <label className="font-medium" htmlFor="hyper-filter">
            きのみ種別:
          </label>
          {/* biome-ignore lint/correctness/useUniqueElementIds: single instance per route */}
          <select
            id="hyper-filter"
            value={hyperFilter}
            onChange={(e) => onHyperFilterChange(e.target.value as 'all' | 'true' | 'false')}
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
            value={localSearchText}
            onChange={(e) => {
              const newValue = e.target.value
              setLocalSearchText(newValue)
              onSearchTextChange(newValue)
            }}
            placeholder="Search by name or ID..."
            className="border rounded px-3 py-1 flex-1 max-w-md"
          />
        </div>
      </div>

      {/* Berry Table/Cards */}
      {isMobile ? (
        // Mobile: Card View
        <div className="space-y-3">
          {filteredBerries.map(berry => (
            <div key={berry.id} className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-medium text-gray-900">{berry.name}</h3>
                  <p className="text-xs text-gray-500">{berry.id}</p>
                </div>
                {berry.hyper && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                    異次元
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Sweet:</span>
                  <span className="font-medium">{berry.flavors.sweet}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Spicy:</span>
                  <span className="font-medium">{berry.flavors.spicy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sour:</span>
                  <span className="font-medium">{berry.flavors.sour}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bitter:</span>
                  <span className="font-medium">{berry.flavors.bitter}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fresh:</span>
                  <span className="font-medium">{berry.flavors.fresh}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">カロリー:</span>
                  <span className="font-medium">{berry.calories}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">レベル:</span>
                  <span className="font-medium">{berry.level}</span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <label htmlFor={`stock-${berry.id}`} className="text-sm font-medium text-gray-700">
                  個数:
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onStockChange(berry.id, Math.max(0, (berryStocks[berry.id] || 0) - 1))}
                    className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-lg font-bold text-gray-700 transition-colors"
                    aria-label={`${berry.name}の個数を減らす`}
                  >
                    −
                  </button>
                  <input
                    id={`stock-${berry.id}`}
                    type="number"
                    min="0"
                    value={berryStocks[berry.id] || 0}
                    onChange={(e) => onStockChange(berry.id, parseInt(e.target.value, 10) || 0)}
                    className="border rounded px-3 py-2 w-16 text-center"
                    aria-label={`${berry.name}の個数`}
                  />
                  <button
                    type="button"
                    onClick={() => onStockChange(berry.id, (berryStocks[berry.id] || 0) + 1)}
                    className="w-10 h-10 flex items-center justify-center bg-blue-500 hover:bg-blue-600 active:bg-blue-700 rounded-lg font-bold text-white transition-colors"
                    aria-label={`${berry.name}の個数を増やす`}
                  >
                    ＋
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Desktop: Table View
        <div className="overflow-x-auto border rounded">
          <table className="min-w-full divide-y divide-gray-200">
            <caption className="sr-only">きのみ在庫入力テーブル</caption>
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {table.getRowModel().rows.map(row => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-4 py-2 text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CSV Import/Export */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label htmlFor="csv-input" className="block font-medium">
            CSV形式でインポート/エクスポート
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors text-sm"
              title="現在のテーブルの状態をCSVに出力"
            >
              エクスポート
            </button>
            <button
              type="button"
              onClick={handleImport}
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
          onChange={(e) => setCsvText(e.target.value)}
          className="w-full border rounded px-3 py-2 font-mono text-sm min-h-[150px] focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="berryId,count&#10;oran-berry,10&#10;pecha-berry,5"
          aria-label="CSV形式でのきのみ在庫データ"
        />
      </div>
    </section>
  )
}
