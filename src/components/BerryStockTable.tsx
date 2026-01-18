import { useMemo, useState, useEffect, useRef } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import type { Berry } from '@/lib/types'
import { berryStocksToCSV, csvToBerryStocks } from '@/lib/csv'
import { BerryStockInput } from './BerryStockInput'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { useFocusTrap } from '@/hooks/useFocusTrap'

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

  // Sorting state
  const [sorting, setSorting] = useState<SortingState>([])

  // CSV state
  const [csvText, setCsvText] = useState('')

  // Reset confirmation modal state
  const [showResetModal, setShowResetModal] = useState(false)

  // Local search input state for IME support
  const [localSearchText, setLocalSearchText] = useState(searchText)

  // Refs for focus management
  const modalRef = useRef<HTMLDivElement>(null)
  const resetButtonRef = useRef<HTMLButtonElement>(null)

  // Focus trap for modal
  useFocusTrap(modalRef, {
    enabled: showResetModal,
    onEscape: () => setShowResetModal(false),
    returnFocusRef: resetButtonRef,
  })

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

  // Handle reset confirmation
  const handleConfirmReset = () => {
    onResetStocks()
    setShowResetModal(false)
  }

  // Define columns for react-table
  // Optimized: Only depends on onStockChange, not berryStocks
  const columns = useMemo<ColumnDef<Berry>[]>(
    () => [
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
        header: 'レベル',
        cell: info => info.getValue(),
      },
      {
        accessorKey: 'calories',
        header: 'カロリー',
        cell: info => info.getValue(),
      },
      {
        accessorKey: 'flavors.sweet',
        header: 'スイート',
        cell: info => {
          const value = info.row.original.flavors.sweet
          return (
            <span className={`inline-block px-2 py-1 rounded ${value > 0 ? 'bg-pink-50' : ''}`}>
              {value}
            </span>
          )
        },
      },
      {
        accessorKey: 'flavors.spicy',
        header: 'スパイシー',
        cell: info => {
          const value = info.row.original.flavors.spicy
          return (
            <span className={`inline-block px-2 py-1 rounded ${value > 0 ? 'bg-red-50' : ''}`}>
              {value}
            </span>
          )
        },
      },
      {
        accessorKey: 'flavors.sour',
        header: 'サワー',
        cell: info => {
          const value = info.row.original.flavors.sour
          return (
            <span className={`inline-block px-2 py-1 rounded ${value > 0 ? 'bg-yellow-50' : ''}`}>
              {value}
            </span>
          )
        },
      },
      {
        accessorKey: 'flavors.bitter',
        header: 'ビター',
        cell: info => {
          const value = info.row.original.flavors.bitter
          return (
            <span className={`inline-block px-2 py-1 rounded ${value > 0 ? 'bg-blue-50' : ''}`}>
              {value}
            </span>
          )
        },
      },
      {
        accessorKey: 'flavors.fresh',
        header: 'フレッシュ',
        cell: info => {
          const value = info.row.original.flavors.fresh
          return (
            <span className={`inline-block px-2 py-1 rounded ${value > 0 ? 'bg-green-50' : ''}`}>
              {value}
            </span>
          )
        },
      },
      {
        accessorKey: 'hyper',
        header: '異次元',
        cell: info => (info.getValue() ? '✔︎' : ''),
      },
    ],
    [onStockChange, berryStocks]
  )

  // Create berry table instance with sorting
  const table = useReactTable({
    data: filteredBerries,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
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
          ref={resetButtonRef}
          type="button"
          onClick={() => setShowResetModal(true)}
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
                      className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-1">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        {{
                          asc: ' ↑',
                          desc: ' ↓',
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
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

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        // biome-ignore lint/a11y/useKeyWithClickEvents: Modal backdrop click is intentional
        // biome-ignore lint/a11y/noStaticElementInteractions: Modal backdrop interaction
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowResetModal(false)}
        >
          <div
            ref={modalRef}
            className="bg-white rounded-lg p-6 max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-modal-title"
          >
            <h3 id="reset-modal-title" className="text-lg font-semibold mb-4">確認</h3>
            <p className="text-gray-700 mb-6">
              すべてのきのみ個数を0にリセットします。この操作は取り消せません。よろしいですか？
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                リセット
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
