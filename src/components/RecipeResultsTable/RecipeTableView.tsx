/**
 * Recipe Table View (Desktop)
 *
 * Virtualized table view for displaying recipe results on desktop screens.
 * Uses TanStack Table for sorting and TanStack Virtual for performance.
 */

import { flexRender } from '@tanstack/react-table'
import type { RecipeRow } from '@/lib/types'
import { useRecipeTableColumns } from './hooks/useRecipeTableColumns'
import { useVirtualizedTable } from './hooks/useVirtualizedTable'

interface RecipeTableViewProps {
  recipes: RecipeRow[]
}

export function RecipeTableView({ recipes }: RecipeTableViewProps) {
  const columns = useRecipeTableColumns()
  const { table, sortedRows, virtualizer, tableContainerRef } = useVirtualizedTable(recipes, columns)

  return (
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
              const toggleSorting = header.column.getToggleSortingHandler()
              return (
                <button
                  key={header.id}
                  type="button"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 flex-shrink-0"
                  style={{ width }}
                  onClick={toggleSorting}
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
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* Virtualized Rows */}
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const row = sortedRows[virtualRow.index]
          return (
            <div
              key={row.id}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
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
  )
}
