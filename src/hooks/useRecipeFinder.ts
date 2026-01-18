import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { berries } from '@/data/berries'
import { donuts } from '@/data/donuts'
import type { BerryStock, DonutRecipe, RecipeRow } from '@/lib/types'
import { DEFAULT_VALUES } from '@/lib/constants'
import type { WorkerRequest, WorkerResponse } from '@/workers/finder.worker'

export function useRecipeFinder() {
  const [recipes, setRecipes] = useState<Map<string, DonutRecipe[]>>(new Map())
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [searchTime, setSearchTime] = useState<number | null>(null)

  // Web Worker reference
  const workerRef = useRef<Worker | null>(null)

  // Initialize Web Worker
  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../workers/finder.worker.ts', import.meta.url),
      { type: 'module' }
    )

    return () => {
      workerRef.current?.terminate()
    }
  }, [])

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

      // Process recipes using Web Worker
      const recipesMap = new Map<string, DonutRecipe[]>()
      const limitReachedDonuts: string[] = []

      // Find recipes for each selected donut using Web Worker
      const promises = Array.from(selectedDonuts).map(async (donutId) => {
        const donut = donuts.find(d => d.id === donutId)
        if (!donut) return

        // Use Web Worker for heavy computation
        const result = await new Promise<{ recipes: DonutRecipe[]; limitReached: boolean }>((resolve, reject) => {
          if (!workerRef.current) {
            reject(new Error('Web Worker is not initialized'))
            return
          }

          const request: WorkerRequest = { donut, stocks, slots }

          const handleMessage = (e: MessageEvent<WorkerResponse>) => {
            if (e.data.success && e.data.result) {
              resolve({
                recipes: e.data.result.recipes,
                limitReached: e.data.result.limitReached,
              })
            } else {
              reject(new Error(e.data.error || 'Worker error'))
            }
            workerRef.current?.removeEventListener('message', handleMessage)
          }

          workerRef.current.addEventListener('message', handleMessage)
          workerRef.current.postMessage(request)
        })

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
  }, [workerRef])

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
