/**
 * Hook for virtualized table setup
 * Manages TanStack Table and TanStack Virtual integration for desktop view
 */

import { useState, useRef } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { RecipeRow } from '@/lib/types'

export function useVirtualizedTable(data: RecipeRow[], columns: ColumnDef<RecipeRow>[]) {
  const [sorting, setSorting] = useState<SortingState>([])
  const tableContainerRef = useRef<HTMLDivElement>(null)

  // Create table instance with sorting
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  // Get sorted rows
  const sortedRows = table.getRowModel().rows

  // Virtualizer for desktop table view with dynamic measurement
  const virtualizer = useVirtualizer({
    count: sortedRows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 53, // Estimated row height in pixels
    measureElement: (element) => element.getBoundingClientRect().height, // Measure actual height
    overscan: 10, // Render extra rows for smooth scrolling
  })

  return {
    table,
    sortedRows,
    virtualizer,
    tableContainerRef,
  }
}
