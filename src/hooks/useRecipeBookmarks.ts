import { useCallback } from 'react'
import { usePersistedState } from './usePersistedState'
import { STORAGE_KEYS } from '@/lib/constants'
import type { RecipeRow } from '@/lib/types'

/**
 * Generate a unique ID for a recipe row
 */
export function generateRecipeId(recipe: RecipeRow): string {
  return `${recipe.donutName}:${recipe.recipeIndex}`
}

/**
 * Hook to manage recipe bookmarks
 */
export function useRecipeBookmarks() {
  const [bookmarkedRecipeIds, setBookmarkedRecipeIds] = usePersistedState<Set<string>>(
    STORAGE_KEYS.BOOKMARKED_RECIPES,
    new Set(),
    (set) => JSON.stringify(Array.from(set)),
    (json) => {
      try {
        const array = JSON.parse(json)
        return new Set(array)
      } catch {
        return new Set()
      }
    }
  )

  const toggleBookmark = useCallback(
    (recipe: RecipeRow) => {
      const recipeId = generateRecipeId(recipe)
      setBookmarkedRecipeIds((prev) => {
        const next = new Set(prev)
        if (next.has(recipeId)) {
          next.delete(recipeId)
        } else {
          next.add(recipeId)
        }
        return next
      })
    },
    [setBookmarkedRecipeIds]
  )

  const isBookmarked = useCallback(
    (recipe: RecipeRow) => {
      const recipeId = generateRecipeId(recipe)
      return bookmarkedRecipeIds.has(recipeId)
    },
    [bookmarkedRecipeIds]
  )

  const clearAllBookmarks = useCallback(() => {
    setBookmarkedRecipeIds(new Set())
  }, [setBookmarkedRecipeIds])

  return {
    bookmarkedRecipeIds,
    toggleBookmark,
    isBookmarked,
    clearAllBookmarks,
  }
}
