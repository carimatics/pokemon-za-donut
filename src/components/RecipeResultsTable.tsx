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
import { RecipeResultsHeader } from './RecipeResultsTable/RecipeResultsHeader'
import { RecipeResultsSummary } from './RecipeResultsTable/RecipeResultsSummary'
import { RecipeSearchConditions } from './RecipeResultsTable/RecipeSearchConditions'
import { RecipeEmptyState } from './RecipeResultsTable/RecipeEmptyState'
import { donuts } from '@/data/donuts'

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

  // Refs for virtualization containers
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const cardContainerRef = useRef<HTMLDivElement>(null)

  // Create donut order map for sorting (matches donut selection table order)
  const donutOrderMap = useMemo(() => {
    const map = new Map<string, number>()
    donuts.forEach((donut, index) => {
      map.set(donut.name, index)
    })
    return map
  }, [])

  // Sort recipe rows by donut order (matches donut selection table)
  const sortedRecipeRows = useMemo(() => {
    return [...recipeRows].sort((a, b) => {
      const orderA = donutOrderMap.get(a.donutName) ?? 999
      const orderB = donutOrderMap.get(b.donutName) ?? 999
      if (orderA !== orderB) {
        return orderA - orderB
      }
      // If same donut, sort by recipe index
      return a.recipeIndex - b.recipeIndex
    })
  }, [recipeRows, donutOrderMap])

  // Handle CSV download
  const handleDownloadCSV = () => {
    const csv = recipeRowsToCSV(sortedRecipeRows)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    downloadCSV(csv, `pokemon-za-recipes-${timestamp}.csv`)
  }

  // Recipe result table columns with fixed widths
  const columns = useMemo<ColumnDef<RecipeRow>[]>(
    () => [
      {
        accessorKey: 'donutName',
        header: 'ドーナツ',
        cell: info => info.getValue(),
        meta: { width: '150px' },
      },
      {
        accessorKey: 'recipeIndex',
        header: 'レシピ#',
        cell: info => info.getValue(),
        meta: { width: '80px' },
      },
      {
        accessorKey: 'berries',
        header: '使用きのみ',
        cell: info => <div className="text-sm whitespace-normal break-words">{info.getValue() as string}</div>,
        meta: { width: '350px' },
      },
      {
        accessorKey: 'totalCalories',
        header: '合計カロリー',
        cell: info => info.getValue(),
        meta: { width: '120px' },
      },
      {
        accessorKey: 'totalLevel',
        header: '合計レベル',
        cell: info => info.getValue(),
        meta: { width: '120px' },
      },
      {
        accessorKey: 'sweet',
        header: 'スイート',
        cell: info => info.getValue(),
        meta: { width: '100px' },
      },
      {
        accessorKey: 'spicy',
        header: 'スパイシー',
        cell: info => info.getValue(),
        meta: { width: '100px' },
      },
      {
        accessorKey: 'sour',
        header: 'サワー',
        cell: info => info.getValue(),
        meta: { width: '100px' },
      },
      {
        accessorKey: 'bitter',
        header: 'ビター',
        cell: info => info.getValue(),
        meta: { width: '100px' },
      },
      {
        accessorKey: 'fresh',
        header: 'フレッシュ',
        cell: info => info.getValue(),
        meta: { width: '100px' },
      },
      {
        accessorKey: 'stars',
        header: '星',
        cell: info => {
          const stars = info.getValue() as number
          return stars > 0 ? '★'.repeat(stars) : '-'
        },
        meta: { width: '100px' },
      },
      {
        accessorKey: 'plusLevel',
        header: 'プラスレベル',
        cell: info => info.getValue(),
        meta: { width: '120px' },
      },
      {
        accessorKey: 'donutEnergy',
        header: 'ハラモチエネルギー',
        cell: info => info.getValue(),
        meta: { width: '150px' },
      },
    ],
    []
  )

  // Create recipe table instance with sorting
  const table = useReactTable({
    data: sortedRecipeRows,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  // Get sorted rows for virtualization
  const sortedRows = table.getRowModel().rows

  // Virtualizer for desktop table view with dynamic measurement
  const tableVirtualizer = useVirtualizer({
    count: sortedRows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 53, // Estimated row height in pixels
    measureElement: (element) => element.getBoundingClientRect().height, // Measure actual height
    overscan: 10, // Render extra rows for smooth scrolling
  })

  // Virtualizer for mobile card view with dynamic measurement
  const cardVirtualizer = useVirtualizer({
    count: sortedRecipeRows.length,
    getScrollElement: () => cardContainerRef.current,
    estimateSize: () => 280, // Estimated card height in pixels
    measureElement: (element) => element.getBoundingClientRect().height, // Measure actual height
    overscan: 5,
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
        hasResults={sortedRecipeRows.length > 0}
        onDownloadCSV={handleDownloadCSV}
      />

      <RecipeResultsSummary
        resultCount={sortedRecipeRows.length}
        searchTime={searchTime}
      />

      <RecipeSearchConditions
        conditions={searchConditions}
        hasResults={sortedRecipeRows.length > 0}
      />

      {sortedRecipeRows.length === 0 ? (
        <RecipeEmptyState
          hasSelectedDonuts={
            searchConditions !== undefined &&
            searchConditions.selectedDonuts.length > 0
          }
        />
      ) : isMobile ? (
        // Mobile: Virtualized Card View
        <div
          ref={cardContainerRef}
          className="overflow-auto border rounded"
          style={{ height: '600px' }}
        >
          <div
            style={{
              height: `${cardVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {cardVirtualizer.getVirtualItems().map((virtualItem) => {
              const recipe = sortedRecipeRows[virtualItem.index]
              return (
                <div
                  key={virtualItem.key}
                  data-index={virtualItem.index}
                  ref={cardVirtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                  className="px-3 py-1.5"
                >
                  <div className="border border-gray-200 rounded-lg p-4 bg-white">
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
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        // Desktop: Virtualized Table View
        <div
          ref={tableContainerRef}
          className="overflow-auto border rounded bg-white"
          style={{ height: '600px' }}
        >
          {/* Sticky Header */}
          <div className="sticky top-0 z-10">
            {table.getHeaderGroups().map(headerGroup => (
              <div key={headerGroup.id} className="flex min-w-max bg-gray-50 border-b border-gray-200">
                {headerGroup.headers.map(header => {
                  const meta = header.column.columnDef.meta as { width?: string }
                  const width = meta?.width || '120px'
                  return (
                    <div
                      key={header.id}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 flex-shrink-0"
                      style={{ width }}
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
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Virtualized Rows */}
          <div
            style={{
              height: `${tableVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {tableVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = sortedRows[virtualRow.index]
              return (
                <div
                  key={row.id}
                  data-index={virtualRow.index}
                  ref={tableVirtualizer.measureElement}
                  className="hover:bg-gray-50 border-b border-gray-200 flex min-w-max"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {row.getVisibleCells().map(cell => {
                    const meta = cell.column.columnDef.meta as { width?: string }
                    const width = meta?.width || '120px'
                    return (
                      <div key={cell.id} className="px-4 py-3 text-sm flex-shrink-0" style={{ width }}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
