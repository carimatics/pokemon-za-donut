/**
 * Recipe Transformer
 *
 * Transforms raw recipe data into table-ready format with calculated metrics.
 * Separates business logic from React hooks for better testability and reusability.
 */

import type { DonutRecipe, RecipeRow, BerryStock, Flavors } from '@/lib/types'
import { donuts } from '@/data/donuts'

/**
 * Calculated totals for a recipe
 */
interface RecipeTotals {
  calories: number
  level: number
  flavors: Flavors
  flavorSum: number
  berryCount: number
}

/**
 * Boost metrics calculated from star rating
 */
interface BoostMetrics {
  stars: number
  plusLevel: number
  donutEnergy: number
}

/**
 * Calculate star rating based on total flavor sum
 */
function calculateStars(flavorSum: number): number {
  if (flavorSum >= 960) return 5
  if (flavorSum >= 700) return 4
  if (flavorSum >= 350) return 3
  if (flavorSum >= 240) return 2
  if (flavorSum >= 120) return 1
  return 0
}

/**
 * Calculate total metrics for berry stocks
 */
function calculateTotals(stocks: BerryStock[]): RecipeTotals {
  const calories = stocks.reduce(
    (sum, stock) => sum + stock.berry.calories * stock.count,
    0
  )

  const level = stocks.reduce(
    (sum, stock) => sum + stock.berry.level * stock.count,
    0
  )

  const flavors = stocks.reduce(
    (acc, stock) => ({
      sweet: acc.sweet + stock.berry.flavors.sweet * stock.count,
      spicy: acc.spicy + stock.berry.flavors.spicy * stock.count,
      sour: acc.sour + stock.berry.flavors.sour * stock.count,
      bitter: acc.bitter + stock.berry.flavors.bitter * stock.count,
      fresh: acc.fresh + stock.berry.flavors.fresh * stock.count,
    }),
    { sweet: 0, spicy: 0, sour: 0, bitter: 0, fresh: 0 }
  )

  const flavorSum = flavors.sweet + flavors.spicy + flavors.sour + flavors.bitter + flavors.fresh
  const berryCount = stocks.reduce((sum, stock) => sum + stock.count, 0)

  return { calories, level, flavors, flavorSum, berryCount }
}

/**
 * Calculate star rating and boost metrics based on flavor sum
 */
function calculateBoost(totals: RecipeTotals): BoostMetrics {
  const stars = calculateStars(totals.flavorSum)
  const boostMultiplier = 1 + 0.1 * stars

  return {
    stars,
    plusLevel: Math.floor(totals.level * boostMultiplier),
    donutEnergy: Math.floor(totals.calories * boostMultiplier),
  }
}

/**
 * Format berry stocks as human-readable text
 */
function formatBerryText(stocks: BerryStock[]): string {
  return stocks
    .map(stock => `${stock.berry.name} x${stock.count}`)
    .join(', ')
}

/**
 * Transform recipes for a single donut
 */
function transformDonutRecipes(
  donutId: string,
  recipes: DonutRecipe[]
): RecipeRow[] {
  const donut = donuts.find(d => d.id === donutId)
  if (!donut) return []

  return recipes.map((recipe, index) => {
    const totals = calculateTotals(recipe.stocks)
    const boost = calculateBoost(totals)

    return {
      donutName: donut.name,
      recipeIndex: index + 1,
      berries: formatBerryText(recipe.stocks),
      berryCount: totals.berryCount,
      totalCalories: totals.calories,
      totalLevel: totals.level,
      sweet: totals.flavors.sweet,
      spicy: totals.flavors.spicy,
      sour: totals.flavors.sour,
      bitter: totals.flavors.bitter,
      fresh: totals.flavors.fresh,
      stars: boost.stars,
      plusLevel: boost.plusLevel,
      donutEnergy: boost.donutEnergy,
    }
  })
}

/**
 * Transform a map of recipes into flat RecipeRow array
 */
export function toRecipeRows(recipes: Map<string, DonutRecipe[]>): RecipeRow[] {
  return Array.from(recipes.entries()).flatMap(([donutId, donutRecipes]) =>
    transformDonutRecipes(donutId, donutRecipes)
  )
}
