/**
 * Hook for recipe CSV export functionality
 * Handles CSV generation and download with timestamped filenames
 */

import { useCallback } from 'react'
import type { RecipeRow } from '@/lib/types'
import { recipeRowsToCSV, downloadCSV } from '@/lib/csv'

export function useRecipeExport(recipes: RecipeRow[]) {
  const handleDownloadCSV = useCallback(() => {
    const csv = recipeRowsToCSV(recipes)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    downloadCSV(csv, `pokemon-za-recipes-${timestamp}.csv`)
  }, [recipes])

  return { handleDownloadCSV }
}
