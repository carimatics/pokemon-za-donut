import { useState, useCallback, useMemo, useRef } from 'react'
import { berries } from '@/data/berries'
import { donuts } from '@/data/donuts'
import type { BerryStock, DonutRecipe, RecipeRow } from '@/lib/types'
import { DEFAULT_VALUES } from '@/lib/constants'
import { EnhancedRecipeFinder } from '@/lib/enhanced-finder'

export function useRecipeFinder() {
  // Create finder instance using useRef to ensure single instance per hook usage
  const finderRef = useRef<EnhancedRecipeFinder | null>(null)
  if (!finderRef.current) {
    finderRef.current = new EnhancedRecipeFinder()
  }
  const finder = finderRef.current

  const [recipes, setRecipes] = useState<Map<string, DonutRecipe[]>>(new Map())
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [searchTime, setSearchTime] = useState<number | null>(null)

  const handleFindRecipes = useCallback(async (
    selectedDonuts: Set<string>,
    berryStocks: Record<string, number>,
    slots: number
  ) => {
    setIsSearching(true)
    setError(null)
    setWarning(null)
    setSearchTime(null)

    const startTime = performance.now()

    try {
      // Build berry stocks array
      const stocks: BerryStock[] = berries
        .filter(berry => (berryStocks[berry.id] || 0) > 0)
        .map(berry => ({
          berry,
          count: berryStocks[berry.id] || 0
        }))

      // Validate inputs
      if (stocks.length === 0) {
        throw new Error('きのみが選択されていません。\n\n解決方法：\n• 「きのみ個数入力」タブで所持しているきのみの個数を1以上に設定してください')
      }

      if (selectedDonuts.size === 0) {
        throw new Error('ドーナツが選択されていません。\n\n解決方法：\n• 「ドーナツ選択」タブで作りたいドーナツをチェックしてください')
      }

      // Process recipes using EnhancedRecipeFinder
      const recipesMap = new Map<string, DonutRecipe[]>()
      const limitReachedDonuts: string[] = []

      // Find recipes for each selected donut
      const promises = Array.from(selectedDonuts).map(async (donutId) => {
        const donut = donuts.find(d => d.id === donutId)
        if (!donut) return

        // Use EnhancedRecipeFinder for parallel or single-threaded computation
        const result = await finder.findRecipes(donut, stocks, slots)

        recipesMap.set(donutId, result.recipes)

        if (result.limitReached) {
          limitReachedDonuts.push(donut.name)
        }
      })

      await Promise.all(promises)

      // Set warning if any donut reached the limit
      if (limitReachedDonuts.length > 0) {
        const donutList = limitReachedDonuts.join('、')
        setWarning(
          `${donutList} のレシピが非常に多く、最初の${DEFAULT_VALUES.MAX_SOLUTIONS.toLocaleString()}件のみ表示しています。`
        )
      }

      setRecipes(recipesMap)
      const endTime = performance.now()
      setSearchTime((endTime - startTime) / 1000) // Convert to seconds
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'レシピの検索中にエラーが発生しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsSearching(false)
    }
  }, [finder])

  // Flatten recipes for table display
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

        // Calculate total berry count
        const berryCount = recipe.stocks.reduce((sum, stock) => sum + stock.count, 0)

        // Calculate total flavor sum
        const totalFlavorSum = totalFlavors.sweet + totalFlavors.spicy + totalFlavors.sour + totalFlavors.bitter + totalFlavors.fresh

        // Calculate stars based on total flavor sum
        let stars = 0
        if (totalFlavorSum >= 960) stars = 5
        else if (totalFlavorSum >= 700) stars = 4
        else if (totalFlavorSum >= 350) stars = 3
        else if (totalFlavorSum >= 240) stars = 2
        else if (totalFlavorSum >= 120) stars = 1

        // Calculate boost multiplier (1 + 0.1 * stars)
        const boostMultiplier = 1 + 0.1 * stars

        // Calculate plus level and energy boost
        const plusLevel = Math.floor(totalLevel * boostMultiplier)
        const donutEnergy = Math.floor(totalCalories * boostMultiplier)

        rows.push({
          donutName: donut.name,
          recipeIndex: index + 1,
          berries: berriesText,
          berryCount,
          totalCalories,
          totalLevel,
          sweet: totalFlavors.sweet,
          spicy: totalFlavors.spicy,
          sour: totalFlavors.sour,
          bitter: totalFlavors.bitter,
          fresh: totalFlavors.fresh,
          stars,
          plusLevel,
          donutEnergy,
        })
      })
    })
    return rows
  }, [recipes])

  return {
    recipes,
    recipeRows,
    handleFindRecipes,
    isSearching,
    error,
    clearError: () => setError(null),
    warning,
    clearWarning: () => setWarning(null),
    searchTime,
  }
}
