/**
 * TypeGPU Integration Tests
 *
 * These tests verify that TypeGPU implementation produces correct results
 * and matches CPU implementation behavior.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { TypeGPURecipeFinder } from '../tgpu-finder'
import { findRequiredCombinations } from '@/lib/finder'
import { isTypeGPUSupported } from '../tgpu-context'
import type { BerryStock, Donut } from '@/lib/types'

// Helper to create test berry stocks
function createBerryStock(
  name: string,
  flavors: { spicy: number; fresh: number; sweet: number; bitter: number; sour: number },
  count: number,
): BerryStock {
  return {
    berry: {
      id: `test-${name.toLowerCase().replace(/\s+/g, '-')}`,
      name,
      level: 1,
      calories: 60,
      flavors,
      hyper: false,
    },
    count,
  }
}

describe('TypeGPU Integration Tests', () => {
  let gpuSupported = false
  let finder: TypeGPURecipeFinder | null = null

  beforeAll(async () => {
    // Check if TypeGPU is supported in test environment
    gpuSupported = await isTypeGPUSupported()

    if (gpuSupported) {
      finder = new TypeGPURecipeFinder()
      try {
        await finder.initialize()
      } catch (error) {
        console.warn('TypeGPU initialization failed in tests:', error)
        gpuSupported = false
        finder = null
      }
    }
  })

  afterAll(() => {
    if (finder) {
      finder.destroy()
    }
  })

  describe('TypeGPURecipeFinder initialization', () => {
    it('should initialize successfully when GPU is available', async () => {
      if (!gpuSupported) {
        return
      }

      expect(finder).not.toBeNull()
    })

    it('should throw error if used before initialization', async () => {
      const uninitializedFinder = new TypeGPURecipeFinder()

      const stocks: BerryStock[] = [
        createBerryStock('TestBerry', { spicy: 5, fresh: 0, sweet: 0, bitter: 0, sour: 0 }, 10),
      ]

      const donut: Donut = {
        id: "test-test", name: 'Test',
        flavors: { spicy: 5, fresh: 0, sweet: 0, bitter: 0, sour: 0 },
      }

      await expect(uninitializedFinder.findRecipes(donut, stocks, 2)).rejects.toThrow(
        'TypeGPU not initialized',
      )
    })
  })

  describe('CPU vs TypeGPU result comparison', () => {
    it('should produce same results as CPU for simple case', async () => {
      if (!gpuSupported || !finder) {
        return
      }

      const stocks: BerryStock[] = [
        createBerryStock('Spicy', { spicy: 10, fresh: 0, sweet: 0, bitter: 0, sour: 0 }, 5),
        createBerryStock('Sweet', { spicy: 0, fresh: 0, sweet: 10, bitter: 0, sour: 0 }, 5),
      ]

      const donut: Donut = {
        id: "test-testdonut", name: 'TestDonut',
        flavors: { spicy: 20, fresh: 0, sweet: 10, bitter: 0, sour: 0 },
      }

      // Get CPU results
      const cpuResult = findRequiredCombinations(donut, stocks, 3)

      // Get TypeGPU results
      const gpuResult = await finder.findRecipes(donut, stocks, 3, 10000)

      // Should find same number of recipes
      expect(gpuResult.recipes.length).toBe(cpuResult.recipes.length)

      // Both should find at least one valid recipe
      expect(gpuResult.recipes.length).toBeGreaterThan(0)
      expect(cpuResult.recipes.length).toBeGreaterThan(0)
    })

    it('should handle complex multi-berry combinations', async () => {
      if (!gpuSupported || !finder) {
        return
      }

      const stocks: BerryStock[] = [
        createBerryStock('Berry1', { spicy: 5, fresh: 3, sweet: 0, bitter: 0, sour: 0 }, 3),
        createBerryStock('Berry2', { spicy: 0, fresh: 5, sweet: 3, bitter: 0, sour: 0 }, 3),
        createBerryStock('Berry3', { spicy: 3, fresh: 0, sweet: 5, bitter: 2, sour: 0 }, 3),
      ]

      const donut: Donut = {
        id: "test-complexdonut", name: 'ComplexDonut',
        flavors: { spicy: 10, fresh: 8, sweet: 8, bitter: 2, sour: 0 },
      }

      const cpuResult = findRequiredCombinations(donut, stocks, 4)
      const gpuResult = await finder.findRecipes(donut, stocks, 4, 10000)

      expect(gpuResult.recipes.length).toBe(cpuResult.recipes.length)
    })

    it('should find no recipes when requirements cannot be met', async () => {
      if (!gpuSupported || !finder) {
        return
      }

      const stocks: BerryStock[] = [
        createBerryStock('Spicy', { spicy: 10, fresh: 0, sweet: 0, bitter: 0, sour: 0 }, 5),
      ]

      const donut: Donut = {
        id: "test-impossibledonut", name: 'ImpossibleDonut',
        flavors: { spicy: 10, fresh: 10, sweet: 10, bitter: 10, sour: 10 }, // Requires fresh but none available
      }

      const cpuResult = findRequiredCombinations(donut, stocks, 5)
      const gpuResult = await finder.findRecipes(donut, stocks, 5, 10000)

      expect(gpuResult.recipes.length).toBe(0)
      expect(cpuResult.recipes.length).toBe(0)
      expect(gpuResult.recipes.length).toBe(cpuResult.recipes.length)
    })

    it('should handle edge case with single berry type', async () => {
      if (!gpuSupported || !finder) {
        return
      }

      const stocks: BerryStock[] = [
        createBerryStock('OnlyBerry', { spicy: 5, fresh: 5, sweet: 5, bitter: 5, sour: 5 }, 10),
      ]

      const donut: Donut = {
        id: "test-balanceddonut", name: 'BalancedDonut',
        flavors: { spicy: 15, fresh: 15, sweet: 15, bitter: 15, sour: 15 },
      }

      const cpuResult = findRequiredCombinations(donut, stocks, 3)
      const gpuResult = await finder.findRecipes(donut, stocks, 3, 10000)

      expect(gpuResult.recipes.length).toBe(cpuResult.recipes.length)

      // Should find exactly 1 recipe (using 3 of the same berry)
      expect(gpuResult.recipes.length).toBe(1)
      expect(cpuResult.recipes.length).toBe(1)
    })
  })

  describe('Real-world berry data', () => {
    it('should work with actual Pokemon berry flavors', async () => {
      if (!gpuSupported || !finder) {
        return
      }

      // Actual Pokemon berry data
      const stocks: BerryStock[] = [
        createBerryStock('Cheri', { spicy: 10, fresh: 0, sweet: 0, bitter: 0, sour: 0 }, 10),
        createBerryStock('Chesto', { spicy: 0, fresh: 10, sweet: 0, bitter: 0, sour: 0 }, 10),
        createBerryStock('Pecha', { spicy: 0, fresh: 0, sweet: 10, bitter: 0, sour: 0 }, 10),
        createBerryStock('Rawst', { spicy: 0, fresh: 0, sweet: 0, bitter: 10, sour: 0 }, 10),
        createBerryStock('Aspear', { spicy: 0, fresh: 0, sweet: 0, bitter: 0, sour: 10 }, 10),
      ]

      const donut: Donut = {
        id: "test-mixeddonut", name: 'MixedDonut',
        flavors: { spicy: 20, fresh: 20, sweet: 20, bitter: 20, sour: 20 },
      }

      const cpuResult = findRequiredCombinations(donut, stocks, 6)
      const gpuResult = await finder.findRecipes(donut, stocks, 6, 10000)

      expect(gpuResult.recipes.length).toBe(cpuResult.recipes.length)
      expect(gpuResult.recipes.length).toBeGreaterThan(0)

      // Verify recipe validity
      if (gpuResult.recipes.length > 0) {
        const recipe = gpuResult.recipes[0]
        let totalSpicy = 0
        let totalFresh = 0
        let totalSweet = 0
        let totalBitter = 0
        let totalSour = 0

        for (const stock of recipe.stocks) {
          totalSpicy += stock.berry.flavors.spicy * stock.count
          totalFresh += stock.berry.flavors.fresh * stock.count
          totalSweet += stock.berry.flavors.sweet * stock.count
          totalBitter += stock.berry.flavors.bitter * stock.count
          totalSour += stock.berry.flavors.sour * stock.count
        }

        expect(totalSpicy).toBeGreaterThanOrEqual(donut.flavors.spicy)
        expect(totalFresh).toBeGreaterThanOrEqual(donut.flavors.fresh)
        expect(totalSweet).toBeGreaterThanOrEqual(donut.flavors.sweet)
        expect(totalBitter).toBeGreaterThanOrEqual(donut.flavors.bitter)
        expect(totalSour).toBeGreaterThanOrEqual(donut.flavors.sour)
      }
    })

    it('should handle partial slot usage correctly', async () => {
      if (!gpuSupported || !finder) {
        return
      }

      const stocks: BerryStock[] = [
        createBerryStock('HighValue', { spicy: 50, fresh: 50, sweet: 50, bitter: 50, sour: 50 }, 5),
      ]

      const donut: Donut = {
        id: "test-simpledonut", name: 'SimpleDonut',
        flavors: { spicy: 50, fresh: 50, sweet: 50, bitter: 50, sour: 50 },
      }

      // With max 8 slots, should find recipes using 1, 2, 3... berries
      const cpuResult = findRequiredCombinations(donut, stocks, 8)
      const gpuResult = await finder.findRecipes(donut, stocks, 8, 10000)

      expect(gpuResult.recipes.length).toBe(cpuResult.recipes.length)

      // Should find recipe with just 1 berry
      expect(gpuResult.recipes.length).toBeGreaterThan(0)
    })
  })

  describe('Performance characteristics', () => {
    it('should handle large batch sizes', async () => {
      if (!gpuSupported || !finder) {
        return
      }

      const stocks: BerryStock[] = [
        createBerryStock('B1', { spicy: 3, fresh: 2, sweet: 1, bitter: 0, sour: 0 }, 8),
        createBerryStock('B2', { spicy: 2, fresh: 3, sweet: 1, bitter: 0, sour: 0 }, 8),
        createBerryStock('B3', { spicy: 1, fresh: 2, sweet: 3, bitter: 0, sour: 0 }, 8),
      ]

      const donut: Donut = {
        id: "test-largetest", name: 'LargeTest',
        flavors: { spicy: 10, fresh: 10, sweet: 10, bitter: 0, sour: 0 },
      }

      const startTime = performance.now()
      const result = await finder.findRecipes(donut, stocks, 5, 50000)
      const endTime = performance.now()

      expect(result.recipes.length).toBeGreaterThan(0)
      console.log(`TypeGPU processed in ${(endTime - startTime).toFixed(2)}ms`)
    })

    it('should respect batch size limits', async () => {
      if (!gpuSupported || !finder) {
        return
      }

      const stocks: BerryStock[] = [
        createBerryStock('B1', { spicy: 1, fresh: 1, sweet: 1, bitter: 1, sour: 1 }, 10),
      ]

      const donut: Donut = {
        id: "test-test", name: 'Test',
        flavors: { spicy: 1, fresh: 1, sweet: 1, bitter: 1, sour: 1 },
      }

      const batchSize = 100
      const result = await finder.findRecipes(donut, stocks, 8, batchSize)

      // Should not exceed batch size
      expect(result.recipes.length).toBeLessThanOrEqual(batchSize)

      // Should indicate if limit was reached
      if (result.recipes.length === batchSize) {
        expect(result.limitReached).toBe(true)
      }
    })
  })

  describe('Error handling', () => {
    it('should handle empty stocks gracefully', async () => {
      if (!gpuSupported || !finder) {
        return
      }

      const stocks: BerryStock[] = []
      const donut: Donut = {
        id: "test-test", name: 'Test',
        flavors: { spicy: 10, fresh: 0, sweet: 0, bitter: 0, sour: 0 },
      }

      const result = await finder.findRecipes(donut, stocks, 3, 1000)

      expect(result.recipes.length).toBe(0)
      expect(result.limitReached).toBe(false)
    })

    it('should handle zero slots', async () => {
      if (!gpuSupported || !finder) {
        return
      }

      const stocks: BerryStock[] = [
        createBerryStock('Berry', { spicy: 10, fresh: 0, sweet: 0, bitter: 0, sour: 0 }, 5),
      ]

      const donut: Donut = {
        id: "test-test", name: 'Test',
        flavors: { spicy: 10, fresh: 0, sweet: 0, bitter: 0, sour: 0 },
      }

      const result = await finder.findRecipes(donut, stocks, 0, 1000)

      expect(result.recipes.length).toBe(0)
    })

    it('should handle stocks with zero count', async () => {
      if (!gpuSupported || !finder) {
        return
      }

      const stocks: BerryStock[] = [
        createBerryStock('Berry1', { spicy: 10, fresh: 0, sweet: 0, bitter: 0, sour: 0 }, 0),
        createBerryStock('Berry2', { spicy: 5, fresh: 0, sweet: 0, bitter: 0, sour: 0 }, 5),
      ]

      const donut: Donut = {
        id: "test-test", name: 'Test',
        flavors: { spicy: 10, fresh: 0, sweet: 0, bitter: 0, sour: 0 },
      }

      const result = await finder.findRecipes(donut, stocks, 3, 1000)

      // Should only use Berry2 (Berry1 has 0 count)
      expect(result.recipes.length).toBeGreaterThan(0)

      for (const recipe of result.recipes) {
        for (const stock of recipe.stocks) {
          expect(stock.berry.name).not.toBe('Berry1')
        }
      }
    })
  })

  describe('Memory management', () => {
    it('should clean up resources properly', async () => {
      if (!gpuSupported) {
        return
      }

      const tempFinder = new TypeGPURecipeFinder()
      await tempFinder.initialize()

      const stocks: BerryStock[] = [
        createBerryStock('Berry', { spicy: 10, fresh: 0, sweet: 0, bitter: 0, sour: 0 }, 5),
      ]

      const donut: Donut = {
        id: "test-test", name: 'Test',
        flavors: { spicy: 20, fresh: 0, sweet: 0, bitter: 0, sour: 0 },
      }

      await tempFinder.findRecipes(donut, stocks, 3, 1000)

      // Should not throw when destroying
      expect(() => tempFinder.destroy()).not.toThrow()
    })

    it('should be safe to destroy multiple times', async () => {
      if (!gpuSupported) {
        return
      }

      const tempFinder = new TypeGPURecipeFinder()
      await tempFinder.initialize()

      tempFinder.destroy()
      expect(() => tempFinder.destroy()).not.toThrow()
      tempFinder.destroy()
      expect(() => tempFinder.destroy()).not.toThrow()
    })
  })
})
