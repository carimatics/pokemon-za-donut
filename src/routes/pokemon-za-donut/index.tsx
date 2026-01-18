import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { useBerryFilter } from '@/hooks/useBerryFilter'
import { useBerryStocks } from '@/hooks/useBerryStocks'
import { useDonutSelection } from '@/hooks/useDonutSelection'
import { useRecipeFinder } from '@/hooks/useRecipeFinder'
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
    setHyperFilter: (filter) => navigate({ search: { ...search, hyperFilter: filter } }),
    setSearchText: (text) => navigate({ search: { ...search, search: text } }),
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

  // Handle tab change with URL sync
  const handleTabChange = (tab: 'donuts' | 'berries' | 'results') => {
    navigate({ search: { ...search, tab } })
  }

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
        <RecipeResultsTable recipeRows={recipeRows} />
      )}

      {/* Floating Action Button */}
      <FloatingActionButton
        disabled={selectedDonuts.size === 0}
        isLoading={isSearching}
        onClick={onFindRecipes}
      />

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
