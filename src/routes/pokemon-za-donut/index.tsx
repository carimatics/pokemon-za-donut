import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
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

export const Route = createFileRoute('/pokemon-za-donut/')({
  component: App,
})

function App() {
  // Tab state
  const [activeTab, setActiveTab] = useState<'donuts' | 'berries' | 'results'>('donuts')

  // Custom hooks
  const {
    filteredBerries,
    hyperFilter,
    setHyperFilter,
    searchText,
    setSearchText,
  } = useBerryFilter()

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
  } = useDonutSelection()

  const {
    recipeRows,
    handleFindRecipes,
    isSearching,
    error,
    clearError,
  } = useRecipeFinder()

  // Handle find recipes with tab navigation and error handling
  const onFindRecipes = async () => {
    try {
      await handleFindRecipes(selectedDonuts, berryStocks, slots)
      setActiveTab('results')
    } catch (err) {
      // Error is already set by useRecipeFinder
      // Toast will display the error
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Pokemon ZA Donut Recipe Finder</h1>

      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

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
    </div>
  )
}
