/**
 * TypeGPU Compute Shaders for Recipe Calculation
 *
 * These shaders perform parallel computation of flavor totals
 * and recipe validation on the GPU using TypeGPU.
 *
 * TypeGPU uses 'use gpu' directive for compute functions that run on GPU.
 */

import type { BerryData, RecipeData, RequiredFlavorsData, FlavorResultData } from './tgpu-schemas'

/**
 * Compute function for calculating recipe flavors
 *
 * This function runs on the GPU and calculates total flavors for each recipe.
 * It uses TypeGPU's 'use gpu' directive to indicate GPU execution.
 *
 * In TypeGPU GPU functions, buffer parameters are typed as the data arrays themselves,
 * not as TgpuBuffer wrappers. TypeGPU's compiler handles the buffer access.
 *
 * @param threadId - Global thread ID (automatically provided by TypeGPU)
 * @param berries - Buffer containing berry data
 * @param recipes - Buffer containing recipe data
 * @param required - Buffer containing required flavors
 * @param results - Buffer to write results to
 */
export function calculateRecipeFlavors(
  threadId: number,
  berries: BerryData[],
  recipes: RecipeData[],
  required: RequiredFlavorsData,
  results: FlavorResultData[],
) {
  'use gpu'

  // Use threadId as recipe index
  const recipeIndex = threadId

  // Bounds check
  if (recipeIndex >= recipes.length) {
    return
  }

  const recipe = recipes[recipeIndex]
  let totalSpicy = 0
  let totalFresh = 0
  let totalSweet = 0
  let totalBitter = 0
  let totalSour = 0
  let isValid = 1

  // Calculate flavor totals
  for (let i = 0; i < recipe.slotCount; i++) {
    const berryIndex = recipe.berryIndices[i]

    // Bounds check for berry index
    if (berryIndex >= berries.length) {
      isValid = 0
      break
    }

    const berry = berries[berryIndex]
    totalSpicy += berry.spicy
    totalFresh += berry.fresh
    totalSweet += berry.sweet
    totalBitter += berry.bitter
    totalSour += berry.sour
  }

  // Validate against required flavors
  if (isValid === 1) {
    if (
      totalSpicy < required.spicy ||
      totalFresh < required.fresh ||
      totalSweet < required.sweet ||
      totalBitter < required.bitter ||
      totalSour < required.sour
    ) {
      isValid = 0
    }
  }

  // Write result
  results[recipeIndex] = {
    totalSpicy,
    totalFresh,
    totalSweet,
    totalBitter,
    totalSour,
    isValid,
    padding: [0, 0],
  }
}

/**
 * Simplified validation function (faster for initial filtering)
 *
 * This function only checks if combinations are valid,
 * without storing detailed flavor totals.
 *
 * @param threadId - Global thread ID
 * @param berries - Buffer containing berry data
 * @param combinations - Buffer containing combination data
 * @param required - Buffer containing required flavors
 * @param isValid - Buffer to write validation results to
 */
export function validateCombinations(
  threadId: number,
  berries: BerryData[],
  combinations: RecipeData[],
  required: RequiredFlavorsData,
  isValid: number[],
) {
  'use gpu'

  const combIndex = threadId

  if (combIndex >= combinations.length) {
    return
  }

  const combination = combinations[combIndex]
  let valid = 1

  let totalSpicy = 0
  let totalFresh = 0
  let totalSweet = 0
  let totalBitter = 0
  let totalSour = 0

  for (let i = 0; i < combination.slotCount; i++) {
    const berryIndex = combination.berryIndices[i]

    if (berryIndex >= berries.length) {
      valid = 0
      break
    }

    const berry = berries[berryIndex]
    totalSpicy += berry.spicy
    totalFresh += berry.fresh
    totalSweet += berry.sweet
    totalBitter += berry.bitter
    totalSour += berry.sour
  }

  if (valid === 1) {
    if (
      totalSpicy < required.spicy ||
      totalFresh < required.fresh ||
      totalSweet < required.sweet ||
      totalBitter < required.bitter ||
      totalSour < required.sour
    ) {
      valid = 0
    }
  }

  isValid[combIndex] = valid
}
