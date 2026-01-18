import { useMemo, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import type { RecipeRow } from '@/lib/types'
import { recipeRowsToCSV, downloadCSV } from '@/lib/csv'

interface RecipeResultsTableProps {
  recipeRows: RecipeRow[]
}

export function RecipeResultsTable({ recipeRows }: RecipeResultsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])

  // Handle CSV download
  const handleDownloadCSV = () => {
    const csv = recipeRowsToCSV(recipeRows)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    downloadCSV(csv, `pokemon-za-recipes-${timestamp}.csv`)
  }

  // Recipe result table columns
  const columns = useMemo<ColumnDef<RecipeRow>[]>(
    () => [
      {
        accessorKey: 'donutName',
        header: 'ドーナツ',
        cell: info => info.getValue(),
      },
      {
        accessorKey: 'recipeIndex',
        header: 'レシピ#',
        cell: info => info.getValue(),
      },
      {
        accessorKey: 'berries',
        header: '使用きのみ',
        cell: info => <div className="text-sm">{info.getValue() as string}</div>,
      },
      {
        accessorKey: 'totalCalories',
        header: '合計カロリー',
        cell: info => info.getValue(),
      },
      {
        accessorKey: 'totalLevel',
        header: '合計レベル',
        cell: info => info.getValue(),
      },
      {
        accessorKey: 'sweet',
        header: 'Sweet',
        cell: info => info.getValue(),
      },
      {
        accessorKey: 'spicy',
        header: 'Spicy',
        cell: info => info.getValue(),
      },
      {
        accessorKey: 'sour',
        header: 'Sour',
        cell: info => info.getValue(),
      },
      {
        accessorKey: 'bitter',
        header: 'Bitter',
        cell: info => info.getValue(),
      },
      {
        accessorKey: 'fresh',
        header: 'Fresh',
        cell: info => info.getValue(),
      },
    ],
    []
  )

  // Create recipe table instance with sorting
  const table = useReactTable({
    data: recipeRows,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <section
      className="space-y-4"
      role="tabpanel"
      id="results-panel"
      aria-labelledby="results-tab"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">レシピ検索結果</h2>
        {recipeRows.length > 0 && (
          <button
            type="button"
            onClick={handleDownloadCSV}
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

      {recipeRows.length === 0 ? (
        <p className="text-gray-500">
          レシピが見つかりませんでした。ドーナツ選択タブでドーナツを選択し、レシピを検索してください。
        </p>
      ) : (
        <div className="overflow-x-auto border rounded">
          <table className="min-w-full divide-y divide-gray-200">
            <caption className="sr-only">レシピ検索結果テーブル</caption>
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
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
                    <td key={cell.id} className="px-4 py-3 text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
