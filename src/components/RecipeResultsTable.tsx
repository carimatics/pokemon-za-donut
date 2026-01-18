import { useMemo, useState, useRef, useCallback } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  type CellContext,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { RecipeRow } from '@/lib/types'
import { recipeRowsToCSV, downloadCSV } from '@/lib/csv'
import { shareRecipe } from '@/lib/share'
import { Toast } from './Toast'

// Enable virtualization for tables with more than this many rows
const VIRTUALIZATION_THRESHOLD = 100

interface RecipeResultsTableProps {
  recipeRows: RecipeRow[]
  searchConditions?: {
    selectedDonuts: string[]
    slots: number
    berryCount: number
  }
  onToggleBookmark?: (recipe: RecipeRow) => void
  isBookmarked?: (recipe: RecipeRow) => boolean
  showBookmarksOnly?: boolean
  onToggleBookmarksFilter?: () => void
}

export function RecipeResultsTable({
  recipeRows,
  searchConditions,
  onToggleBookmark,
  isBookmarked,
  showBookmarksOnly,
  onToggleBookmarksFilter,
}: RecipeResultsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [shareMessage, setShareMessage] = useState<string | null>(null)

  // Filter bookmarked recipes if filter is active
  const displayedRows = useMemo(() => {
    if (!showBookmarksOnly || !isBookmarked) return recipeRows
    return recipeRows.filter(row => isBookmarked(row))
  }, [recipeRows, showBookmarksOnly, isBookmarked])

  // Handle recipe sharing
  const handleShareRecipe = useCallback(async (recipe: RecipeRow) => {
    const success = await shareRecipe(recipe)
    if (success) {
      setShareMessage('レシピをクリップボードにコピーしました')
    } else {
      setShareMessage('クリップボードへのコピーに失敗しました')
    }
  }, [])

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
      ...(onToggleBookmark && isBookmarked
        ? [
            {
              id: 'bookmark',
              header: 'ブックマーク',
              cell: (info: CellContext<RecipeRow, unknown>) => {
                const recipe = info.row.original
                const bookmarked = isBookmarked(recipe)
                return (
                  <button
                    type="button"
                    onClick={() => onToggleBookmark(recipe)}
                    className="text-2xl hover:scale-110 transition-transform"
                    aria-label={bookmarked ? 'ブックマークを解除' : 'ブックマークに追加'}
                    title={bookmarked ? 'ブックマークを解除' : 'ブックマークに追加'}
                  >
                    {bookmarked ? '★' : '☆'}
                  </button>
                )
              },
            } as ColumnDef<RecipeRow>,
          ]
        : []),
      {
        id: 'share',
        header: '共有',
        cell: (info: CellContext<RecipeRow, unknown>) => {
          const recipe = info.row.original
          return (
            <button
              type="button"
              onClick={() => handleShareRecipe(recipe)}
              className="text-blue-600 hover:text-blue-800 hover:scale-110 transition-transform"
              aria-label="レシピを共有"
              title="レシピをクリップボードにコピー"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
              </svg>
            </button>
          )
        },
      },
    ],
    [onToggleBookmark, isBookmarked, handleShareRecipe]
  )

  // Create recipe table instance with sorting
  const table = useReactTable({
    data: displayedRows,
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
    <section
      className="space-y-4"
      role="tabpanel"
      id="results-panel"
      aria-labelledby="results-tab"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">レシピ検索結果</h2>
        {recipeRows.length > 0 && (
          <div className="flex gap-2">
            {onToggleBookmarksFilter && (
              <button
                type="button"
                onClick={onToggleBookmarksFilter}
                className={`px-4 py-2 rounded transition-colors flex items-center gap-2 ${
                  showBookmarksOnly
                    ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                title={showBookmarksOnly ? 'すべてのレシピを表示' : 'ブックマークのみ表示'}
              >
                <span className="text-xl" aria-hidden="true">
                  {showBookmarksOnly ? '★' : '☆'}
                </span>
                {showBookmarksOnly ? 'ブックマークのみ' : 'すべて表示'}
              </button>
            )}
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
          </div>
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
          レシピが見つかりませんでした。ドーナツ選択タブでドーナツを選択し、レシピを検索してください。
        </p>
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

      {/* Share Toast */}
      {shareMessage && (
        <Toast
          message={shareMessage}
          variant="info"
          onClose={() => setShareMessage(null)}
        />
      )}
    </section>
  )
}
