/**
 * Hook for sorting recipe rows by donut order
 * Ensures recipe display matches donut selection table order
 */

import { useMemo } from 'react'
import type { RecipeRow } from '@/lib/types'
import { useDonutOrderMap } from './useDonutOrderMap'

export function useSortedRecipes(recipeRows: RecipeRow[]) {
  const donutOrderMap = useDonutOrderMap()

  return useMemo(() => {
    return [...recipeRows].sort((a, b) => {
      // Primary sort: by donut order
      const orderA = donutOrderMap.get(a.donutName) ?? 999
      const orderB = donutOrderMap.get(b.donutName) ?? 999

      if (orderA !== orderB) {
        return orderA - orderB
      }

      // Secondary sort: by recipe index
      return a.recipeIndex - b.recipeIndex
    })
  }, [recipeRows, donutOrderMap])
}
