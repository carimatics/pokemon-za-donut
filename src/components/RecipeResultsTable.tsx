/**
 * Recipe Results Table (Refactored)
 *
 * Main controller component for displaying recipe search results.
 * Delegates to RecipeTableView (desktop) or RecipeCardView (mobile).
 *
 * Architecture:
 * - Hooks extracted to RecipeResultsTable/hooks/
 * - Views extracted to RecipeTableView and RecipeCardView
 * - Data transformation logic moved to RecipeTransformer
 */

import type { RecipeRow } from '@/lib/types'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { useSortedRecipes } from './RecipeResultsTable/hooks/useSortedRecipes'
import { useRecipeExport } from './RecipeResultsTable/hooks/useRecipeExport'
import { RecipeResultsHeader } from './RecipeResultsTable/RecipeResultsHeader'
import { RecipeResultsSummary } from './RecipeResultsTable/RecipeResultsSummary'
import { RecipeSearchConditions } from './RecipeResultsTable/RecipeSearchConditions'
import { RecipeEmptyState } from './RecipeResultsTable/RecipeEmptyState'
import { RecipeTableView } from './RecipeResultsTable/RecipeTableView'
import { RecipeCardView } from './RecipeResultsTable/RecipeCardView'

interface RecipeResultsTableProps {
  recipeRows: RecipeRow[]
  searchConditions?: {
    selectedDonuts: string[]
    slots: number
    berryCount: number
  }
  searchTime?: number | null
  isSearching?: boolean
}

export function RecipeResultsTable({
  recipeRows,
  searchConditions,
  searchTime,
  isSearching = false,
}: RecipeResultsTableProps) {
  const isMobile = useIsMobile()

  // Sort recipes by donut order (matches donut selection table)
  const sortedRecipeRows = useSortedRecipes(recipeRows)

  // CSV export functionality
  const { handleDownloadCSV } = useRecipeExport(sortedRecipeRows)

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
        isSearching={isSearching}
      />

      <RecipeSearchConditions
        conditions={searchConditions}
        hasResults={sortedRecipeRows.length > 0}
      />

      {isSearching ? null : sortedRecipeRows.length === 0 ? (
        <RecipeEmptyState
          hasSelectedDonuts={
            searchConditions !== undefined &&
            searchConditions.selectedDonuts.length > 0
          }
        />
      ) : isMobile ? (
        <RecipeCardView recipes={sortedRecipeRows} />
      ) : (
        <RecipeTableView recipes={sortedRecipeRows} />
      )}
    </section>
  )
}
