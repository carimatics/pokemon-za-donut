import { useState, useCallback, useMemo } from 'react'
import { berries } from '@/data/berries'
import { donuts } from '@/data/donuts'
import { findRequiredCombinations } from '@/lib/finder'
import type { BerryStock, DonutRecipe, RecipeRow } from '@/lib/types'
import { DEFAULT_VALUES } from '@/lib/constants'

export function useRecipeFinder() {
  const [recipes, setRecipes] = useState<Map<string, DonutRecipe[]>>(new Map())
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)

  const handleFindRecipes = useCallback(async (
    selectedDonuts: Set<string>,
    berryStocks: Record<string, number>,
    slots: number
  ) => {
    setIsSearching(true)
    setError(null)
    setWarning(null)

    try {
      // Simulate async operation to keep UI responsive during heavy computation
      const newRecipes = await new Promise<Map<string, DonutRecipe[]>>((resolve, reject) => {
        setTimeout(() => {
          try {
            const recipesMap = new Map<string, DonutRecipe[]>()
            const limitReachedDonuts: string[] = []

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

            // Find recipes for each selected donut
            selectedDonuts.forEach(donutId => {
              const donut = donuts.find(d => d.id === donutId)
              if (donut) {
                const result = findRequiredCombinations(donut, stocks, slots)
                recipesMap.set(donutId, result.recipes)

                // Track if limit was reached for this donut
                if (result.limitReached) {
                  limitReachedDonuts.push(donut.name)
                }
              }
            })

            // Set warning if any donut reached the limit
            if (limitReachedDonuts.length > 0) {
              const donutList = limitReachedDonuts.join('、')
              setWarning(
                `${donutList} のレシピが非常に多く、最初の${DEFAULT_VALUES.MAX_SOLUTIONS.toLocaleString()}件のみ表示しています。`
              )
            }

            resolve(recipesMap)
          } catch (err) {
            reject(err)
          }
        }, 0)
      })

      setRecipes(newRecipes)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'レシピの検索中にエラーが発生しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsSearching(false)
    }
  }, [])

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

  return {
    recipes,
    recipeRows,
    handleFindRecipes,
    isSearching,
    error,
    clearError: () => setError(null),
    warning,
    clearWarning: () => setWarning(null),
  }
}
