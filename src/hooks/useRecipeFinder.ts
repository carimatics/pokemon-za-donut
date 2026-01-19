import { useState, useCallback, useMemo, useRef } from 'react'
import { berries } from '@/data/berries'
import { donuts } from '@/data/donuts'
import type { BerryStock, DonutRecipe, RecipeRow } from '@/lib/types'
import { DEFAULT_VALUES } from '@/lib/constants'
import { EnhancedRecipeFinder } from '@/lib/enhanced-finder'
import { toRecipeRows } from '@/lib/recipe-transformer'

export function useRecipeFinder() {
  // Create finder instance using useRef to ensure single instance per hook usage
  const finderRef = useRef<EnhancedRecipeFinder | null>(null)
  if (!finderRef.current) {
    finderRef.current = new EnhancedRecipeFinder()
  }
  const finder = finderRef.current

  // AbortController for search cancellation
  const abortControllerRef = useRef<AbortController | null>(null)

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
    // Cancel any previous search
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new AbortController for this search
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

    setIsSearching(true)
    setError(null)
    setWarning(null)
    setSearchTime(null)

    const startTime = performance.now()

    try {
      // Check if already aborted
      if (signal.aborted) {
        return
      }
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

      // Edge case validations
      if (slots < 1 || slots > 20) {
        throw new Error('スロット数は1〜20の範囲で指定してください。')
      }

      const totalBerries = Object.values(berryStocks).reduce((sum, count) => sum + count, 0)
      if (totalBerries > 9999) {
        throw new Error('きのみの合計個数が多すぎます（上限: 9999個）。\n\n解決方法：\n• 「きのみ個数入力」タブで個数を減らしてください')
      }

      if (selectedDonuts.size > 50) {
        setWarning('50個以上のドーナツが選択されています。処理に時間がかかる場合があります。')
      }

      // Process recipes using EnhancedRecipeFinder
      const recipesMap = new Map<string, DonutRecipe[]>()
      const limitReachedDonuts: string[] = []

      // Find recipes for each selected donut
      const promises = Array.from(selectedDonuts).map(async (donutId) => {
        // Check for cancellation before processing each donut
        if (signal.aborted) {
          throw new DOMException('Search cancelled', 'AbortError')
        }

        const donut = donuts.find(d => d.id === donutId)
        if (!donut) return

        // Use EnhancedRecipeFinder for parallel or single-threaded computation
        const result = await finder.findRecipes(donut, stocks, slots)

        // Check for cancellation after each donut completes
        if (signal.aborted) {
          throw new DOMException('Search cancelled', 'AbortError')
        }

        recipesMap.set(donutId, result.recipes)

        if (result.limitReached) {
          limitReachedDonuts.push(donut.name)
        }
      })

      await Promise.all(promises)

      // Final cancellation check
      if (signal.aborted) {
        return
      }

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
      // Handle cancellation gracefully
      if (err instanceof DOMException && err.name === 'AbortError') {
        // Search was cancelled - don't set error
        return
      }

      const errorMessage = err instanceof Error ? err.message : 'レシピの検索中にエラーが発生しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsSearching(false)
    }
  }, [finder])

  // Transform recipes to table rows
  const recipeRows = useMemo<RecipeRow[]>(
    () => toRecipeRows(recipes),
    [recipes]
  )

  // Cancel search function
  const cancelSearch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsSearching(false)
    }
  }, [])

  return {
    recipes,
    recipeRows,
    handleFindRecipes,
    cancelSearch,
    isSearching,
    error,
    clearError: () => setError(null),
    warning,
    clearWarning: () => setWarning(null),
    searchTime,
  }
}
