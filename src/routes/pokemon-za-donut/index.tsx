import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { useMemo, useCallback, useState } from 'react'
import { donuts } from '@/data/donuts'
import { useBerryFilter } from '@/hooks/useBerryFilter'
import { useBerryStocks } from '@/hooks/useBerryStocks'
import { useDonutSelection } from '@/hooks/useDonutSelection'
import { useRecipeFinder } from '@/hooks/useRecipeFinder'
import { useRecipeBookmarks } from '@/hooks/useRecipeBookmarks'
import { TabNavigation } from '@/components/TabNavigation'
import { DonutSelectionTable } from '@/components/DonutSelectionTable'
import { BerryStockTable } from '@/components/BerryStockTable'
import { RecipeResultsTable } from '@/components/RecipeResultsTable'
import { FloatingActionButton } from '@/components/FloatingActionButton'
import { Toast } from '@/components/Toast'

// Search params schema for URL state management
const searchSchema = z.object({
  tab: z.enum(['donuts', 'berries', 'results']).optional().default('donuts'),
  slots: z.number().optional().default(8),
  hyperFilter: z.enum(['all', 'true', 'false']).optional().default('all'),
  search: z.string().optional().default(''),
})

export const Route = createFileRoute('/pokemon-za-donut/')({
  component: App,
  validateSearch: searchSchema,
})

function App() {
  const navigate = Route.useNavigate()
  const search = Route.useSearch()

  // Tab state synchronized with URL
  const activeTab = search.tab

  // Memoized URL update callbacks for filter
  const handleHyperFilterChange = useCallback(
    (filter: 'all' | 'true' | 'false') => {
      navigate({ search: { ...search, hyperFilter: filter } })
    },
    [navigate, search]
  )

  const handleSearchTextChange = useCallback(
    (text: string) => {
      navigate({ search: { ...search, search: text } })
    },
    [navigate, search]
  )

  // Custom hooks
  const {
    filteredBerries,
    hyperFilter,
    setHyperFilter,
    searchText,
    setSearchText,
  } = useBerryFilter({
    hyperFilter: search.hyperFilter,
    searchText: search.search,
    setHyperFilter: handleHyperFilterChange,
    setSearchText: handleSearchTextChange,
  })

  const {
    berryStocks,
    handleStockChange,
    handleResetStocks,
  } = useBerryStocks()

  const {
    selectedDonuts,
    handleDonutToggle,
    slots,
    setSlots,
  } = useDonutSelection(search.slots)

  const {
    recipeRows,
    handleFindRecipes,
    isSearching,
    error,
    clearError,
    warning,
    clearWarning,
  } = useRecipeFinder()

  const {
    toggleBookmark,
    isBookmarked,
  } = useRecipeBookmarks()

  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false)

  // Handle tab change with URL sync
  const handleTabChange = (tab: 'donuts' | 'berries' | 'results') => {
    navigate({ search: { ...search, tab } })
  }

  // Handle bookmarks filter toggle
  const handleToggleBookmarksFilter = useCallback(() => {
    setShowBookmarksOnly(prev => !prev)
  }, [])

  // Handle find recipes with tab navigation and error handling
  const onFindRecipes = async () => {
    try {
      await handleFindRecipes(selectedDonuts, berryStocks, slots)
      navigate({ search: { ...search, tab: 'results' } })
    } catch {
      // Error is already set by useRecipeFinder
      // Toast will display the error
    }
  }

  // Compute search conditions for results display
  const searchConditions = useMemo(() => {
    if (recipeRows.length === 0) return undefined

    const selectedDonutNames = Array.from(selectedDonuts)
      .map(id => donuts.find(d => d.id === id)?.name)
      .filter(Boolean) as string[]

    const berryCount = Object.values(berryStocks).filter(count => count > 0).length

    return {
      selectedDonuts: selectedDonutNames,
      slots,
      berryCount,
    }
  }, [selectedDonuts, slots, berryStocks, recipeRows.length])

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Pokémon LEGENDS ZA Donut Recipe Finder</h1>

      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Tab Content */}
      {activeTab === 'donuts' && (
        <DonutSelectionTable
          selectedDonuts={selectedDonuts}
          onDonutToggle={handleDonutToggle}
          slots={slots}
          onSlotsChange={setSlots}
        />
      )}

      {activeTab === 'berries' && (
        <BerryStockTable
          filteredBerries={filteredBerries}
          berryStocks={berryStocks}
          onStockChange={handleStockChange}
          onResetStocks={handleResetStocks}
          hyperFilter={hyperFilter}
          onHyperFilterChange={setHyperFilter}
          searchText={searchText}
          onSearchTextChange={setSearchText}
        />
      )}

      {activeTab === 'results' && (
        <RecipeResultsTable
          recipeRows={recipeRows}
          searchConditions={searchConditions}
          onToggleBookmark={toggleBookmark}
          isBookmarked={isBookmarked}
          showBookmarksOnly={showBookmarksOnly}
          onToggleBookmarksFilter={handleToggleBookmarksFilter}
        />
      )}

      {/* Floating Action Button */}
      <FloatingActionButton
        disabled={selectedDonuts.size === 0}
        isLoading={isSearching}
        onClick={onFindRecipes}
      />

      {/* Navigation Helper - Show when no donuts selected and not on donuts tab */}
      {selectedDonuts.size === 0 && activeTab !== 'donuts' && (
        <div className="fixed bottom-24 right-8 bg-yellow-50 border border-yellow-300 rounded-lg p-4 shadow-lg max-w-xs z-40">
          <p className="text-sm text-yellow-900 mb-2 font-medium">ドーナツが未選択です</p>
          <p className="text-xs text-yellow-800 mb-3">
            レシピを検索するには、まずドーナツを選択してください
          </p>
          <button
            type="button"
            onClick={() => handleTabChange('donuts')}
            className="w-full bg-yellow-500 text-white px-3 py-2 rounded text-sm hover:bg-yellow-600 transition-colors"
          >
            ドーナツ選択タブへ →
          </button>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <Toast
          message={error}
          variant="error"
          onClose={clearError}
        />
      )}

      {/* Warning Toast */}
      {warning && (
        <Toast
          message={warning}
          variant="info"
          onClose={clearWarning}
        />
      )}
    </div>
  )
}
