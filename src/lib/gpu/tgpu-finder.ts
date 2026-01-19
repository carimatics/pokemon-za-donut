/**
 * TypeGPU-based Recipe Finder
 *
 * GPU-accelerated recipe finding using TypeGPU for better type safety
 * and simplified buffer management.
 */

import tgpu from 'typegpu'
import * as d from 'typegpu/data'
import type { BerryStock, Donut, DonutRecipe } from '@/lib/types'
import type { FindRecipesResult } from '@/lib/finder'
import { initializeTypeGPU, cleanupTypeGPU } from './tgpu-context'
import { berrySchema, recipeSchema, requiredFlavorsSchema, flavorResultSchema } from './tgpu-schemas'
import type { BerryData, RecipeData, RequiredFlavorsData, FlavorResultData } from './tgpu-schemas'

const MAX_SLOTS = 8

/**
 * TypeGPU-accelerated recipe finder
 *
 * Uses TypeGPU for type-safe GPU computation with automatic buffer management.
 */
export class TypeGPURecipeFinder {
  private root: Awaited<ReturnType<typeof tgpu.init>> | null = null
  private initialized = false

  /**
   * Initialize TypeGPU context and resources
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    try {
      this.root = await initializeTypeGPU()
      this.initialized = true
      console.log('[TypeGPURecipeFinder] Initialized successfully')
    } catch (error) {
      console.error('[TypeGPURecipeFinder] Initialization failed:', error)
      throw error
    }
  }

  /**
   * Find recipes using TypeGPU acceleration
   *
   * @param required - Target donut with required flavors
   * @param stocks - Available berry stocks
   * @param slots - Number of berry slots
   * @param batchSize - Number of recipes to process in each batch
   * @returns Found recipes and whether limit was reached
   */
  async findRecipes(
    required: Donut,
    stocks: BerryStock[],
    slots: number,
    batchSize = 10000,
  ): Promise<FindRecipesResult> {
    if (!this.root || !this.initialized) {
      throw new Error('TypeGPU not initialized. Call initialize() first.')
    }

    // Generate candidate recipes
    const candidates = this.generateCandidateRecipes(stocks, slots, batchSize)

    if (candidates.length === 0) {
      return { recipes: [], limitReached: false }
    }

    console.log(`[TypeGPURecipeFinder] Processing ${candidates.length} candidates`)

    // Convert data to TypeGPU format
    const berriesData = this.stocksToGPUFormat(stocks)
    const recipesData = this.candidatesToGPUFormat(candidates)
    const requiredData = this.flavorsToGPUFormat(required.flavors)

    // Create buffers using TypeGPU
    const berriesBuffer = this.root
      .createBuffer(d.arrayOf(berrySchema, berriesData.length), berriesData)
      .$usage('storage')

    const recipesBuffer = this.root
      .createBuffer(d.arrayOf(recipeSchema, recipesData.length), recipesData)
      .$usage('storage')

    const requiredBuffer = this.root.createBuffer(requiredFlavorsSchema, requiredData).$usage('uniform')

    // Create results buffer (initialized with zeros)
    const resultsData = new Array(recipesData.length).fill({
      totalSpicy: 0,
      totalFresh: 0,
      totalSweet: 0,
      totalBitter: 0,
      totalSour: 0,
      isValid: 0,
      padding: [0, 0],
    })

    const resultsBuffer = this.root
      .createBuffer(d.arrayOf(flavorResultSchema, resultsData.length), resultsData)
      .$usage('storage')

    try {
      // Create compute pipeline using unstable API
      // The callback is converted to WGSL and executed on the GPU
      // TypeScript doesn't understand TypeGPU's buffer transformations, so we use type assertions
      const pipeline = this.root['~unstable'].createGuardedComputePipeline(
        (recipeIndex: number) => {
          'use gpu'

          // TypeGPU transforms buffer access at compile time - type assertions needed for TypeScript
          const recipesData = recipesBuffer as unknown as RecipeData[]
          const berriesData = berriesBuffer as unknown as BerryData[]
          const requiredData = requiredBuffer as unknown as RequiredFlavorsData
          const resultsData = resultsBuffer as unknown as FlavorResultData[]

          // Bounds check
          if (recipeIndex >= recipesData.length) {
            return
          }

          const recipe = recipesData[recipeIndex]
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
            if (berryIndex >= berriesData.length) {
              isValid = 0
              break
            }

            const berry = berriesData[berryIndex]
            totalSpicy += berry.spicy
            totalFresh += berry.fresh
            totalSweet += berry.sweet
            totalBitter += berry.bitter
            totalSour += berry.sour
          }

          // Validate against required flavors
          if (isValid === 1) {
            if (
              totalSpicy < requiredData.spicy ||
              totalFresh < requiredData.fresh ||
              totalSweet < requiredData.sweet ||
              totalBitter < requiredData.bitter ||
              totalSour < requiredData.sour
            ) {
              isValid = 0
            }
          }

          // Write result
          resultsData[recipeIndex] = {
            totalSpicy,
            totalFresh,
            totalSweet,
            totalBitter,
            totalSour,
            isValid,
            padding: [0, 0],
          }
        },
      )

      // Dispatch threads (one thread per recipe)
      pipeline.dispatchThreads(recipesData.length)

      // Read results from GPU
      const results = await resultsBuffer.read()

      console.log(`[TypeGPURecipeFinder] GPU processing complete, found ${results.filter((r: FlavorResultData) => r.isValid === 1).length} valid recipes`)

      // Convert results to DonutRecipe format
      const recipes = this.convertResults(results, candidates, required, stocks)

      // Clean up buffers
      berriesBuffer.destroy()
      recipesBuffer.destroy()
      requiredBuffer.destroy()
      resultsBuffer.destroy()

      return {
        recipes,
        limitReached: recipes.length >= batchSize,
      }
    } catch (error) {
      console.error('[TypeGPURecipeFinder] GPU processing failed:', error)

      // Clean up buffers on error
      berriesBuffer.destroy()
      recipesBuffer.destroy()
      requiredBuffer.destroy()
      resultsBuffer.destroy()

      throw error
    }
  }

  /**
   * Clean up TypeGPU resources
   */
  destroy(): void {
    if (this.root) {
      cleanupTypeGPU()
      this.root = null
      this.initialized = false
      console.log('[TypeGPURecipeFinder] Resources cleaned up')
    }
  }

  /**
   * Generate candidate recipes for GPU processing
   */
  private generateCandidateRecipes(
    stocks: BerryStock[],
    slots: number,
    maxCandidates: number,
  ): number[][] {
    const candidates: number[][] = []

    const generateCombinations = (
      current: number[],
      remaining: number,
      startIndex: number,
    ): void => {
      if (candidates.length >= maxCandidates) {
        return
      }

      // Add current combination if it has at least one berry
      if (current.length > 0 && current.length <= slots) {
        candidates.push([...current])
      }

      if (remaining === 0) {
        return
      }

      for (let i = startIndex; i < stocks.length && candidates.length < maxCandidates; i++) {
        const maxUse = Math.min(stocks[i].count, remaining)

        for (let use = 1; use <= maxUse && candidates.length < maxCandidates; use++) {
          for (let j = 0; j < use; j++) {
            current.push(i)
          }

          generateCombinations(current, remaining - use, i + 1)

          for (let j = 0; j < use; j++) {
            current.pop()
          }
        }
      }
    }

    generateCombinations([], slots, 0)

    console.log(`[TypeGPURecipeFinder] Generated ${candidates.length} candidate combinations`)
    return candidates
  }

  /**
   * Convert berry stocks to TypeGPU format
   */
  private stocksToGPUFormat(stocks: BerryStock[]): BerryData[] {
    return stocks.map((stock, index) => ({
      berryId: index,
      spicy: stock.berry.flavors.spicy,
      fresh: stock.berry.flavors.fresh,
      sweet: stock.berry.flavors.sweet,
      bitter: stock.berry.flavors.bitter,
      sour: stock.berry.flavors.sour,
      count: stock.count,
      padding: 0,
    }))
  }

  /**
   * Convert candidate recipes to TypeGPU format
   */
  private candidatesToGPUFormat(candidates: number[][]): RecipeData[] {
    return candidates.map((candidate) => {
      const indices = new Array(MAX_SLOTS).fill(0)
      for (let i = 0; i < candidate.length && i < MAX_SLOTS; i++) {
        indices[i] = candidate[i]
      }
      return {
        berryIndices: indices,
        slotCount: Math.min(candidate.length, MAX_SLOTS),
        padding: [0, 0, 0],
      }
    })
  }

  /**
   * Convert flavors to TypeGPU format
   */
  private flavorsToGPUFormat(flavors: {
    spicy: number
    fresh: number
    sweet: number
    bitter: number
    sour: number
  }): RequiredFlavorsData {
    return {
      spicy: flavors.spicy,
      fresh: flavors.fresh,
      sweet: flavors.sweet,
      bitter: flavors.bitter,
      sour: flavors.sour,
      padding: [0, 0, 0],
    }
  }

  /**
   * Convert GPU results to DonutRecipe format
   */
  private convertResults(
    results: FlavorResultData[],
    candidates: number[][],
    required: Donut,
    stocks: BerryStock[],
  ): DonutRecipe[] {
    const recipes: DonutRecipe[] = []

    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      if (result.isValid === 1) {
        const candidate = candidates[i]

        // Count berries in this recipe
        const berryCounts = new Map<number, number>()
        for (const berryIndex of candidate) {
          berryCounts.set(berryIndex, (berryCounts.get(berryIndex) || 0) + 1)
        }

        // Create recipe stocks
        const recipeStocks: BerryStock[] = []
        for (const [berryIndex, count] of berryCounts) {
          recipeStocks.push({
            berry: stocks[berryIndex].berry,
            count,
          })
        }

        recipes.push({
          donut: required,
          stocks: recipeStocks,
        })
      }
    }

    return recipes
  }
}
