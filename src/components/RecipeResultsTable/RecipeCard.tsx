/**
 * Recipe Card Component
 *
 * Displays a single recipe in card format for mobile view.
 * Shows donut info, ingredients, stats, and flavor values.
 */

import type { RecipeRow } from '@/lib/types'

interface RecipeCardProps {
  recipe: RecipeRow
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      {/* Header: Donut name, recipe index, stars */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-gray-900">{recipe.donutName}</h3>
          <p className="text-sm text-gray-500">レシピ #{recipe.recipeIndex}</p>
          {recipe.stars > 0 && (
            <p className="text-yellow-500 text-lg mt-1">{'★'.repeat(recipe.stars)}</p>
          )}
        </div>
        <div className="text-right text-gray-800">
          <p>
            <span className="text-xs">+Lv. </span>
            <span className="font-bold">{recipe.plusLevel}</span>
          </p>
          <p>
            <span className="text-sm font-medium">{recipe.donutEnergy}</span>
            <span className="text-xs"> kcal</span>
          </p>
        </div>
      </div>

      {/* Berry info */}
      <div className="mb-3">
        <p className="text-xs font-medium text-gray-700 mb-1">使用きのみ:</p>
        <p className="text-sm text-gray-600">{recipe.berries}</p>
        <p className="text-xs text-gray-500 mt-1">きのみ個数: {recipe.berryCount}個</p>
        <p className="text-xs text-gray-500">合計カロリー: {recipe.totalCalories}kcal / 合計レベル: Lv.{recipe.totalLevel}</p>
      </div>

      {/* Flavor grid */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="text-center p-2 bg-pink-50 rounded">
          <p className="text-gray-600">Sweet</p>
          <p className="font-medium">{recipe.sweet}</p>
        </div>
        <div className="text-center p-2 bg-red-50 rounded">
          <p className="text-gray-600">Spicy</p>
          <p className="font-medium">{recipe.spicy}</p>
        </div>
        <div className="text-center p-2 bg-yellow-50 rounded">
          <p className="text-gray-600">Sour</p>
          <p className="font-medium">{recipe.sour}</p>
        </div>
        <div className="text-center p-2 bg-blue-50 rounded">
          <p className="text-gray-600">Bitter</p>
          <p className="font-medium">{recipe.bitter}</p>
        </div>
        <div className="text-center p-2 bg-green-50 rounded">
          <p className="text-gray-600">Fresh</p>
          <p className="font-medium">{recipe.fresh}</p>
        </div>
      </div>
    </div>
  )
}
