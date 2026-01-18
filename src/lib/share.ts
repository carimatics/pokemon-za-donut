import type { RecipeRow } from './types'

/**
 * Generate shareable text for a recipe
 */
export function generateShareText(recipe: RecipeRow): string {
  return `【Pokémon LEGENDS ZA ドーナツレシピ】

ドーナツ: ${recipe.donutName}
レシピ番号: ${recipe.recipeIndex}

使用きのみ:
${recipe.berries}

合計カロリー: ${recipe.totalCalories}
合計レベル: ${recipe.totalLevel}

フレーバー:
Sweet: ${recipe.sweet} | Spicy: ${recipe.spicy} | Sour: ${recipe.sour}
Bitter: ${recipe.bitter} | Fresh: ${recipe.fresh}

#PokemonLegendsZA #ドーナツレシピ`
}

/**
 * Copy text to clipboard with fallback support
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // Modern Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }

    // Fallback for older browsers or non-secure contexts
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    const successful = document.execCommand('copy')
    textArea.remove()

    return successful
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
}

/**
 * Share a recipe by copying formatted text to clipboard
 */
export async function shareRecipe(recipe: RecipeRow): Promise<boolean> {
  const shareText = generateShareText(recipe)
  return await copyToClipboard(shareText)
}
