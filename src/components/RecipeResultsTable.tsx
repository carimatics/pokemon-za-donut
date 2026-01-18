import { useMemo, useState, useRef } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { RecipeRow } from '@/lib/types'
import { recipeRowsToCSV, downloadCSV } from '@/lib/csv'
import { useIsMobile } from '@/hooks/useMediaQuery'

// Enable virtualization for tables with more than this many rows
const VIRTUALIZATION_THRESHOLD = 100

interface RecipeResultsTableProps {
  recipeRows: RecipeRow[]
  searchConditions?: {
    selectedDonuts: string[]
    slots: number
    berryCount: number
  }
}

export function RecipeResultsTable({
  recipeRows,
  searchConditions,
}: RecipeResultsTableProps) {
  const isMobile = useIsMobile()
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
      {
        accessorKey: 'stars',
        header: '星',
        cell: info => {
          const stars = info.getValue() as number
          return stars > 0 ? '★'.repeat(stars) : '-'
        },
      },
      {
        accessorKey: 'plusLevel',
        header: 'プラスレベル',
        cell: info => info.getValue(),
      },
      {
        accessorKey: 'energyBoost',
        header: 'ハラモチエネルギー',
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

  // Setup virtualization for large result sets
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const shouldVirtualize = recipeRows.length > VIRTUALIZATION_THRESHOLD

  const rowVirtualizer = useVirtualizer({
    count: shouldVirtualize ? table.getRowModel().rows.length : 0,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 50, // Estimated row height
    overscan: 10,
  })

  return (
    // biome-ignore lint/correctness/useUniqueElementIds: single instance per route
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

      {/* Search Conditions Display */}
      {searchConditions && recipeRows.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm">
          <h3 className="font-semibold text-gray-700 mb-2">検索条件</h3>
          <div className="space-y-1 text-gray-600">
            <div>
              <span className="font-medium">選択ドーナツ:</span>{' '}
              {searchConditions.selectedDonuts.join('、')}
            </div>
            <div>
              <span className="font-medium">スロット数:</span> {searchConditions.slots}
            </div>
            <div>
              <span className="font-medium">使用可能きのみ:</span> {searchConditions.berryCount}種類
            </div>
          </div>
        </div>
      )}

      {recipeRows.length === 0 ? (
        <p className="text-gray-500">
          {searchConditions && searchConditions.selectedDonuts.length > 0
            ? '選択されたドーナツに対して、条件を満たすレシピが見つかりませんでした。'
            : 'ドーナツ選択タブでドーナツを選択し、レシピを検索してください。'}
        </p>
      ) : isMobile ? (
        // Mobile: Card View
        <div className="space-y-3">
          {recipeRows.map((recipe) => (
            <div key={`${recipe.donutName}-${recipe.recipeIndex}`} className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium text-gray-900">{recipe.donutName}</h3>
                  <p className="text-sm text-gray-500">レシピ #{recipe.recipeIndex}</p>
                  {recipe.stars > 0 && (
                    <p className="text-yellow-500 text-lg mt-1">{'★'.repeat(recipe.stars)}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-blue-600">{recipe.totalCalories}cal</p>
                  <p className="text-xs text-gray-500">Lv.{recipe.totalLevel}</p>
                </div>
              </div>
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-700 mb-1">使用きのみ:</p>
                <p className="text-sm text-gray-600">{recipe.berries}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center p-2 bg-pink-50 rounded">
                  <p className="text-gray-600">Sweet</p>
                  <p className="font-medium">{recipe.sweet}</p>
                </div>
                <div className="text-center p-2 bg-red-50 rounded">
                  <p className="text-gray-600">Spicy</p>
                  <p className="font-medium">{recipe.spicy}</p>
                </div>
                <div className="text-center p-2 bg-yellow-50 rounded">
                  <p className="text-gray-600">Sour</p>
                  <p className="font-medium">{recipe.sour}</p>
                </div>
                <div className="text-center p-2 bg-blue-50 rounded">
                  <p className="text-gray-600">Bitter</p>
                  <p className="font-medium">{recipe.bitter}</p>
                </div>
                <div className="text-center p-2 bg-green-50 rounded">
                  <p className="text-gray-600">Fresh</p>
                  <p className="font-medium">{recipe.fresh}</p>
                </div>
              </div>
              {recipe.stars > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-2 gap-2 text-xs">
                  <div className="text-center p-2 bg-purple-50 rounded">
                    <p className="text-gray-600">プラスレベル</p>
                    <p className="font-medium text-purple-700">{recipe.plusLevel}</p>
                  </div>
                  <div className="text-center p-2 bg-orange-50 rounded">
                    <p className="text-gray-600">ハラモチ</p>
                    <p className="font-medium text-orange-700">{recipe.energyBoost}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : shouldVirtualize ? (
        // Virtualized rendering for large datasets (>100 rows)
        <div
          ref={tableContainerRef}
          className="overflow-auto border rounded"
          style={{ maxHeight: '600px' }}
        >
          <table className="min-w-full divide-y divide-gray-200">
            <caption className="sr-only">レシピ検索結果テーブル（仮想化）</caption>
            <thead className="bg-gray-50 sticky top-0 z-10">
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
            <tbody className="bg-white">
              <tr style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
                <td colSpan={columns.length} style={{ padding: 0 }}>
                  <div style={{ position: 'relative' }}>
                    {rowVirtualizer.getVirtualItems().map(virtualRow => {
                      const row = table.getRowModel().rows[virtualRow.index]
                      return (
                        <div
                          key={row.id}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: `${virtualRow.size}px`,
                            transform: `translateY(${virtualRow.start}px)`,
                          }}
                          className="flex hover:bg-gray-50 border-b border-gray-200"
                        >
                          {row.getVisibleCells().map(cell => (
                            <div key={cell.id} className="px-4 py-3 text-sm flex-1">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        // Normal rendering for small datasets (<= 100 rows)
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
