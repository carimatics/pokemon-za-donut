import { useMemo, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table'
import type { Berry } from '@/lib/types'
import { berryStocksToCSV, csvToBerryStocks } from '@/lib/csv'

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
  // CSV state
  const [csvText, setCsvText] = useState('')

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
            <input
              type="number"
              min="0"
              value={berryStocks[berry.id] || 0}
              onChange={(e) => onStockChange(berry.id, parseInt(e.target.value, 10) || 0)}
              className="border rounded px-2 py-1 w-20"
              aria-label={`${berry.name}の個数`}
            />
          )
        },
      },
    ],
    [berryStocks, onStockChange]
  )

  // Create berry table instance
  const table = useReactTable({
    data: filteredBerries,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
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

      {/* Berry Table using react-table */}
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
