import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { berries } from '@/data/berries'
import { donuts } from '@/data/donuts'
import { findRequiredCombinations } from '@/lib/finder'
import type { Berry, BerryStock, DonutRecipe, Donut } from '@/lib/types'

export const Route = createFileRoute('/pokemon-za-donut/')({
  component: App,
})

function App() {
  // State management
  const [berryStocks, setBerryStocks] = useState<Record<string, number>>({})
  const [hyperFilter, setHyperFilter] = useState<'all' | 'true' | 'false'>('all')
  const [searchText, setSearchText] = useState('')
  const [selectedDonuts, setSelectedDonuts] = useState<Set<string>>(new Set())
  const [slots, setSlots] = useState<number>(8)
  const [recipes, setRecipes] = useState<Map<string, DonutRecipe[]>>(new Map())
  const [activeTab, setActiveTab] = useState<'donuts' | 'berries' | 'results'>('donuts')
  const [recipeSorting, setRecipeSorting] = useState<SortingState>([])

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
        header: '個数',
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

  // Create berry table instance
  const berryTable = useReactTable({
    data: filteredBerries,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  // Donut selection table columns
  const donutColumns = useMemo<ColumnDef<Donut>[]>(
    () => [
      {
        id: 'select',
        header: '選択',
        cell: info => {
          const donut = info.row.original
          return (
            <input
              type="checkbox"
              checked={selectedDonuts.has(donut.id)}
              onChange={() => handleDonutToggle(donut.id)}
              className="w-4 h-4"
            />
          )
        },
      },
      {
        accessorKey: 'name',
        header: 'ドーナツ名',
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
    ],
    [selectedDonuts]
  )

  // Create donut table instance
  const donutTable = useReactTable({
    data: donuts,
    columns: donutColumns,
    getCoreRowModel: getCoreRowModel(),
  })

  // Flatten recipes for table display
  type RecipeRow = {
    donutName: string
    recipeIndex: number
    berries: string
    totalCalories: number
    totalLevel: number
    sweet: number
    spicy: number
    sour: number
    bitter: number
    fresh: number
  }

  const recipeRows = useMemo<RecipeRow[]>(() => {
    const rows: RecipeRow[] = []
    recipes.forEach((donutRecipes, donutId) => {
      const donut = donuts.find(d => d.id === donutId)
      if (!donut) return

      donutRecipes.forEach((recipe, index) => {
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

        const berriesText = recipe.stocks
          .map(stock => `${stock.berry.name} x${stock.count}`)
          .join(', ')

        rows.push({
          donutName: donut.name,
          recipeIndex: index + 1,
          berries: berriesText,
          totalCalories,
          totalLevel,
          sweet: totalFlavors.sweet,
          spicy: totalFlavors.spicy,
          sour: totalFlavors.sour,
          bitter: totalFlavors.bitter,
          fresh: totalFlavors.fresh,
        })
      })
    })
    return rows
  }, [recipes])

  // Recipe result table columns
  const recipeColumns = useMemo<ColumnDef<RecipeRow>[]>(
    () => [
      {
        accessorKey: 'donutName',
        header: 'ドーナツ',
        cell: info => info.getValue(),
      },
      {
        accessorKey: 'recipeIndex',
        header: 'レシピ#',
        cell: info => info.getValue(),
      },
      {
        accessorKey: 'berries',
        header: '使用きのみ',
        cell: info => <div className="text-sm">{info.getValue() as string}</div>,
      },
      {
        accessorKey: 'totalCalories',
        header: '合計カロリー',
        cell: info => info.getValue(),
      },
      {
        accessorKey: 'totalLevel',
        header: '合計レベル',
        cell: info => info.getValue(),
      },
      {
        accessorKey: 'sweet',
        header: 'Sweet',
        cell: info => info.getValue(),
      },
      {
        accessorKey: 'spicy',
        header: 'Spicy',
        cell: info => info.getValue(),
      },
      {
        accessorKey: 'sour',
        header: 'Sour',
        cell: info => info.getValue(),
      },
      {
        accessorKey: 'bitter',
        header: 'Bitter',
        cell: info => info.getValue(),
      },
      {
        accessorKey: 'fresh',
        header: 'Fresh',
        cell: info => info.getValue(),
      },
    ],
    []
  )

  // Create recipe table instance with sorting
  const recipeTable = useReactTable({
    data: recipeRows,
    columns: recipeColumns,
    state: {
      sorting: recipeSorting,
    },
    onSortingChange: setRecipeSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
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
            onClick={() => setActiveTab('donuts')}
            className={`py-2 px-4 border-b-2 font-medium transition-colors ${
              activeTab === 'donuts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            ドーナツ選択
          </button>
          <button
            onClick={() => setActiveTab('berries')}
            className={`py-2 px-4 border-b-2 font-medium transition-colors ${
              activeTab === 'berries'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            きのみ個数入力
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
      {activeTab === 'donuts' ? (
        /* Donut Selection Tab */
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">ドーナツ選択</h2>
            <div className="flex gap-2 items-center">
              <label className="font-medium" htmlFor="slots-input">利用できるきのみ数:</label>
              <input
                id="slots-input"
                type="number"
                min="1"
                value={slots}
                onChange={(e) => setSlots(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="border rounded px-3 py-1 w-24"
              />
            </div>
          </div>

          {/* Donut Table */}
          <div className="overflow-x-auto border rounded">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                {donutTable.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
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
                {donutTable.getRowModel().rows.map(row => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-4 py-3 text-sm">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : activeTab === 'berries' ? (
        /* Berry Stock Input Tab */
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">きのみ個数入力</h2>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex gap-2 items-center">
              <label className="font-medium" htmlFor="hyper-filter">きのみ種別:</label>
              <select
                id="hyper-filter"
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
              <label className="font-medium" htmlFor="search-input">Search:</label>
              <input
                id="search-input"
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
                {berryTable.getHeaderGroups().map(headerGroup => (
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
                {berryTable.getRowModel().rows.map(row => (
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
      ) : (
        /* Recipe Results Tab */
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">レシピ検索結果</h2>

          {recipeRows.length === 0 ? (
            <p className="text-gray-500">レシピが見つかりませんでした。ドーナツ選択タブでドーナツを選択し、レシピを検索してください。</p>
          ) : (
            <div className="overflow-x-auto border rounded">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  {recipeTable.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <th
                          key={header.id}
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                          onClick={header.column.getToggleSortingHandler()}
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
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recipeTable.getRowModel().rows.map(row => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="px-4 py-3 text-sm">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Floating Action Button */}
      <button
        type="button"
        onClick={handleFindRecipes}
        disabled={selectedDonuts.size === 0}
        className="fixed bottom-8 right-8 bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors z-50"
        title="レシピを検索"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-6 h-6"
          aria-label="検索アイコン"
        >
          <title>検索</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
      </button>
    </div>
  )
}
