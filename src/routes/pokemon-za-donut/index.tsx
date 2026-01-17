import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table'
import { berries } from '@/data/berries'
import { donuts } from '@/data/donuts'
import { findRequiredCombinations } from '@/lib/finder'
import type { Berry, BerryStock, DonutRecipe } from '@/lib/types'

export const Route = createFileRoute('/pokemon-za-donut/')({
  component: App,
})

function App() {
  // State management
  const [berryStocks, setBerryStocks] = useState<Record<string, number>>({})
  const [hyperFilter, setHyperFilter] = useState<'all' | 'true' | 'false'>('all')
  const [searchText, setSearchText] = useState('')
  const [selectedDonuts, setSelectedDonuts] = useState<Set<string>>(new Set())
  const [slots, setSlots] = useState<number>(10)
  const [recipes, setRecipes] = useState<Map<string, DonutRecipe[]>>(new Map())
  const [activeTab, setActiveTab] = useState<'input' | 'results'>('input')

  // Filter berries based on hyper filter and search text
  const filteredBerries = useMemo(() => {
    return berries.filter(berry => {
      // Hyper filter
      if (hyperFilter !== 'all' && berry.hyper !== (hyperFilter === 'true')) {
        return false
      }

      // Search filter
      if (searchText) {
        const search = searchText.toLowerCase()
        return berry.name.toLowerCase().includes(search) ||
               berry.id.toLowerCase().includes(search)
      }

      return true
    })
  }, [hyperFilter, searchText])

  // Define columns for react-table
  const columns = useMemo<ColumnDef<Berry>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: info => info.getValue(),
      },
      {
        accessorKey: 'id',
        header: 'ID',
        cell: info => <span className="text-gray-500">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'level',
        header: 'Level',
        cell: info => info.getValue(),
      },
      {
        accessorKey: 'calories',
        header: 'Calories',
        cell: info => info.getValue(),
      },
      {
        accessorKey: 'flavors.sweet',
        header: 'Sweet',
        cell: info => info.row.original.flavors.sweet,
      },
      {
        accessorKey: 'flavors.spicy',
        header: 'Spicy',
        cell: info => info.row.original.flavors.spicy,
      },
      {
        accessorKey: 'flavors.sour',
        header: 'Sour',
        cell: info => info.row.original.flavors.sour,
      },
      {
        accessorKey: 'flavors.bitter',
        header: 'Bitter',
        cell: info => info.row.original.flavors.bitter,
      },
      {
        accessorKey: 'flavors.fresh',
        header: 'Fresh',
        cell: info => info.row.original.flavors.fresh,
      },
      {
        accessorKey: 'hyper',
        header: '異次元',
        cell: info => (info.getValue() ? '✔︎' : ''),
      },
      {
        id: 'stock',
        header: 'Stock',
        cell: info => {
          const berry = info.row.original
          return (
            <input
              type="number"
              min="0"
              value={berryStocks[berry.id] || 0}
              onChange={(e) => handleStockChange(berry.id, parseInt(e.target.value) || 0)}
              className="border rounded px-2 py-1 w-20"
            />
          )
        },
      },
    ],
    [berryStocks]
  )

  // Create table instance
  const table = useReactTable({
    data: filteredBerries,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  // Handle berry stock change
  const handleStockChange = (berryId: string, count: number) => {
    setBerryStocks(prev => ({
      ...prev,
      [berryId]: Math.max(0, count)
    }))
  }

  // Handle donut selection
  const handleDonutToggle = (donutId: string) => {
    setSelectedDonuts(prev => {
      const next = new Set(prev)
      if (next.has(donutId)) {
        next.delete(donutId)
      } else {
        next.add(donutId)
      }
      return next
    })
  }

  // Find recipes for selected donuts
  const handleFindRecipes = () => {
    const newRecipes = new Map<string, DonutRecipe[]>()

    // Build berry stocks array
    const stocks: BerryStock[] = berries
      .filter(berry => (berryStocks[berry.id] || 0) > 0)
      .map(berry => ({
        berry,
        count: berryStocks[berry.id] || 0
      }))

    // Find recipes for each selected donut
    selectedDonuts.forEach(donutId => {
      const donut = donuts.find(d => d.id === donutId)
      if (donut) {
        const donutRecipes = findRequiredCombinations(donut, stocks, slots)
        newRecipes.set(donutId, donutRecipes)
      }
    })

    setRecipes(newRecipes)
    // Switch to results tab after finding recipes
    setActiveTab('results')
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Pokemon ZA Donut Recipe Finder</h1>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('input')}
            className={`py-2 px-4 border-b-2 font-medium transition-colors ${
              activeTab === 'input'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            入力
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`py-2 px-4 border-b-2 font-medium transition-colors ${
              activeTab === 'results'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            レシピ検索結果
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'input' ? (
        <div className="space-y-8">
          {/* Berry Stock Section */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Berry Stock</h2>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex gap-2 items-center">
                <label className="font-medium">きのみ種別:</label>
                <select
                  value={hyperFilter}
                  onChange={(e) => setHyperFilter(e.target.value as 'all' | 'true' | 'false')}
                  className="border rounded px-2 py-1"
                >
                  <option value="all">すべて</option>
                  <option value="true">異次元のみ</option>
                  <option value="false">通常のみ</option>
                </select>
              </div>

              <div className="flex gap-2 items-center flex-1">
                <label className="font-medium">Search:</label>
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search by name or ID..."
                  className="border rounded px-3 py-1 flex-1 max-w-md"
                />
              </div>
            </div>

            {/* Berry Table using react-table */}
            <div className="overflow-x-auto border rounded">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <th
                          key={header.id}
                          className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {table.getRowModel().rows.map(row => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="px-4 py-2 text-sm">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Donut Selection and Slot Configuration */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Recipe Finder Configuration</h2>

            <div className="space-y-4">
              {/* Donut Selection */}
              <div>
                <label className="font-medium block mb-2">Select Donuts:</label>
                <div className="space-y-2">
                  {donuts.map(donut => (
                    <label key={donut.id} className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={selectedDonuts.has(donut.id)}
                        onChange={() => handleDonutToggle(donut.id)}
                        className="w-4 h-4 mt-1"
                      />
                      <div className="flex flex-col">
                        <span>{donut.name}</span>
                        <span className="text-sm text-gray-500">
                          Sweet: {donut.flavors.sweet}, Spicy: {donut.flavors.spicy},
                          Sour: {donut.flavors.sour}, Bitter: {donut.flavors.bitter},
                          Fresh: {donut.flavors.fresh}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Slot Number */}
              <div className="flex gap-2 items-center">
                <label className="font-medium">Slot Count:</label>
                <input
                  type="number"
                  min="1"
                  value={slots}
                  onChange={(e) => setSlots(Math.max(1, parseInt(e.target.value) || 1))}
                  className="border rounded px-3 py-1 w-24"
                />
              </div>

              {/* Find Recipes Button */}
              <button
                onClick={handleFindRecipes}
                disabled={selectedDonuts.size === 0}
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Find Recipes
              </button>
            </div>
          </section>
        </div>
      ) : (
        /* Recipe Results Tab */
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Recipe Results</h2>

          {recipes.size === 0 ? (
            <p className="text-gray-500">No recipes found. Please go to the input tab and search for recipes.</p>
          ) : (
            Array.from(recipes.entries()).map(([donutId, donutRecipes]) => {
              const donut = donuts.find(d => d.id === donutId)
              if (!donut) return null

              return (
                <div key={donutId} className="space-y-4">
                  <h3 className="text-xl font-semibold">
                    {donut.name} ({donutRecipes.length} recipes found)
                  </h3>

                  {donutRecipes.length === 0 ? (
                    <p className="text-gray-500">No recipes found with current berry stocks.</p>
                  ) : (
                    <div className="space-y-4">
                      {donutRecipes.map((recipe, index) => {
                        // Calculate totals
                        const totalCalories = recipe.stocks.reduce(
                          (sum, stock) => sum + stock.berry.calories * stock.count,
                          0
                        )
                        const totalLevel = recipe.stocks.reduce(
                          (sum, stock) => sum + stock.berry.level * stock.count,
                          0
                        )
                        const totalFlavors = recipe.stocks.reduce(
                          (acc, stock) => ({
                            sweet: acc.sweet + stock.berry.flavors.sweet * stock.count,
                            spicy: acc.spicy + stock.berry.flavors.spicy * stock.count,
                            sour: acc.sour + stock.berry.flavors.sour * stock.count,
                            bitter: acc.bitter + stock.berry.flavors.bitter * stock.count,
                            fresh: acc.fresh + stock.berry.flavors.fresh * stock.count,
                          }),
                          { sweet: 0, spicy: 0, sour: 0, bitter: 0, fresh: 0 }
                        )

                        return (
                          <div key={index} className="border rounded p-4 bg-gray-50">
                            <h4 className="font-medium mb-2">Recipe #{index + 1}</h4>

                            {/* Berry usage */}
                            <div className="mb-3">
                              <p className="text-sm font-medium mb-1">Berries Used:</p>
                              <div className="flex flex-wrap gap-2">
                                {recipe.stocks.map((stock, i) => (
                                  <span key={i} className="bg-white px-3 py-1 rounded border text-sm">
                                    {stock.berry.name} x {stock.count}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Totals */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                              <div>
                                <span className="font-medium">Total Calories:</span> {totalCalories}
                              </div>
                              <div>
                                <span className="font-medium">Total Level:</span> {totalLevel}
                              </div>
                              <div>
                                <span className="font-medium">Sweet:</span> {totalFlavors.sweet}
                              </div>
                              <div>
                                <span className="font-medium">Spicy:</span> {totalFlavors.spicy}
                              </div>
                              <div>
                                <span className="font-medium">Sour:</span> {totalFlavors.sour}
                              </div>
                              <div>
                                <span className="font-medium">Bitter:</span> {totalFlavors.bitter}
                              </div>
                              <div>
                                <span className="font-medium">Fresh:</span> {totalFlavors.fresh}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </section>
      )}
    </div>
  )
}
