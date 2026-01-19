/**
 * Hook for virtualized card view setup
 * Manages TanStack Virtual for mobile card display
 */

import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { RecipeRow } from '@/lib/types'

export function useVirtualizedCards(recipes: RecipeRow[]) {
  const cardContainerRef = useRef<HTMLDivElement>(null)

  // Virtualizer for mobile card view with dynamic measurement
  const virtualizer = useVirtualizer({
    count: recipes.length,
    getScrollElement: () => cardContainerRef.current,
    estimateSize: () => 280, // Estimated card height in pixels
    measureElement: (element) => element.getBoundingClientRect().height, // Measure actual height
    overscan: 5,
  })

  return {
    virtualizer,
    cardContainerRef,
  }
}
