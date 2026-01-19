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
import { useIsMobile } from '@/hooks/useMediaQuery'
import { RecipeResultsHeader } from './RecipeResultsTable/RecipeResultsHeader'
import { RecipeResultsSummary } from './RecipeResultsTable/RecipeResultsSummary'
import { RecipeSearchConditions } from './RecipeResultsTable/RecipeSearchConditions'
import { RecipeEmptyState } from './RecipeResultsTable/RecipeEmptyState'

interface RecipeResultsTableProps {
  recipeRows: RecipeRow[]
  searchConditions?: {
    selectedDonuts: string[]
    slots: number
    berryCount: number
  }
  searchTime?: number | null
}

export function RecipeResultsTable({
  recipeRows,
  searchConditions,
  searchTime,
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
        header: 'スイート',
        cell: info => info.getValue(),
      },
      {
        accessorKey: 'spicy',
        header: 'スパイシー',
        cell: info => info.getValue(),
      },
      {
        accessorKey: 'sour',
        header: 'サワー',
        cell: info => info.getValue(),
      },
      {
        accessorKey: 'bitter',
        header: 'ビター',
        cell: info => info.getValue(),
      },
      {
        accessorKey: 'fresh',
        header: 'フレッシュ',
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
        accessorKey: 'donutEnergy',
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

  return (
    // biome-ignore lint/correctness/useUniqueElementIds: single instance per route
    <section
      className="space-y-4"
      role="tabpanel"
      id="results-panel"
      aria-labelledby="results-tab"
    >
      <RecipeResultsHeader
        hasResults={recipeRows.length > 0}
        onDownloadCSV={handleDownloadCSV}
      />

      <RecipeResultsSummary
        resultCount={recipeRows.length}
        searchTime={searchTime}
      />

      <RecipeSearchConditions
        conditions={searchConditions}
        hasResults={recipeRows.length > 0}
      />

      {recipeRows.length === 0 ? (
        <RecipeEmptyState
          hasSelectedDonuts={
            searchConditions !== undefined &&
            searchConditions.selectedDonuts.length > 0
          }
        />
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
                    <p className="font-medium text-orange-700">{recipe.donutEnergy}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
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
