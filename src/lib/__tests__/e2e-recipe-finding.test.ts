/**
 * End-to-End Recipe Finding Tests
 *
 * Tests using actual berry and donut data from the application
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { EnhancedRecipeFinder } from '../enhanced-finder'
import { findRequiredCombinations } from '../finder'
import { berries } from '@/data/berries'
import { donuts } from '@/data/donuts'
import type { BerryStock } from '@/lib/types'
import { isTypeGPUSupported } from '../gpu/tgpu-context'


describe('E2E Recipe Finding with Real Data', () => {
  let finder: EnhancedRecipeFinder
  let gpuSupported = false

  beforeAll(async () => {
    finder = new EnhancedRecipeFinder()
    await finder.initialize()
    gpuSupported = await isTypeGPUSupported()
  })

  afterAll(() => {
    finder.destroy()
  })

  describe('Real donut recipes', () => {
    it('should find recipes for high sweet requirement donut', async () => {
      // Use donut with high sweet requirement
      const targetDonut = donuts.find((d) => d.flavors.sweet > 200)
      if (!targetDonut) {
        // Skip if no matching donut
        return
      }

      // Create stocks with all berries
      const stocks: BerryStock[] = berries.map((berry) => ({
        berry,
        count: 10,
      }))

      const cpuResult = findRequiredCombinations(targetDonut, stocks, 6)
      const enhancedResult = await finder.findRecipes(targetDonut, stocks, 6)

      expect(enhancedResult.recipes.length).toBe(cpuResult.recipes.length)
    })

    it('should find recipes for high spicy requirement donut', async () => {
      const targetDonut = donuts.find((d) => d.flavors.spicy > 100)
      if (!targetDonut) {
        return
      }

      const stocks: BerryStock[] = berries.map((berry) => ({
        berry,
        count: 10,
      }))

      const cpuResult = findRequiredCombinations(targetDonut, stocks, 6)
      const enhancedResult = await finder.findRecipes(targetDonut, stocks, 6)

      expect(enhancedResult.recipes.length).toBe(cpuResult.recipes.length)
    })

    it('should find recipes for balanced donut', async () => {
      // Find donut with relatively balanced requirements
      const targetDonut = donuts.find(
        (d) =>
          d.flavors.spicy > 50 &&
          d.flavors.fresh > 50 &&
          d.flavors.sweet > 50 &&
          d.flavors.bitter > 20 &&
          d.flavors.sour > 20,
      )

      if (!targetDonut) {
        return
      }

      const stocks: BerryStock[] = berries.map((berry) => ({
        berry,
        count: 10,
      }))

      const cpuResult = findRequiredCombinations(targetDonut, stocks, 6)
      const enhancedResult = await finder.findRecipes(targetDonut, stocks, 6)

      expect(enhancedResult.recipes.length).toBe(cpuResult.recipes.length)
    })
  })

  describe('Real berry combinations', () => {
    it('should work with first 3 berries', async () => {
      const stocks: BerryStock[] = berries.slice(0, 3).map((berry) => ({
        berry,
        count: 10,
      }))

      // Create simple donut requirement
      const donut = {
        id: "test-donut",
        name: 'Test',
        flavors: { spicy: 20, fresh: 20, sweet: 0, bitter: 0, sour: 0 },
      }

      const cpuResult = findRequiredCombinations(donut, stocks, 5)
      const enhancedResult = await finder.findRecipes(donut, stocks, 5)

      expect(enhancedResult.recipes.length).toBe(cpuResult.recipes.length)
    })

    it('should handle all berries scenario', async () => {
      const allStocks: BerryStock[] = berries.map((berry) => ({
        berry,
        count: 5,
      }))

      const donut = {
        id: "test-donut",
        name: 'ComplexTest',
        flavors: { spicy: 50, fresh: 50, sweet: 50, bitter: 50, sour: 50 },
      }

      const cpuResult = findRequiredCombinations(donut, allStocks, 6)
      const enhancedResult = await finder.findRecipes(donut, allStocks, 6)

      expect(enhancedResult.recipes.length).toBe(cpuResult.recipes.length)
      expect(enhancedResult.recipes.length).toBeGreaterThan(0)
    })
  })

  describe('Performance comparison', () => {
    it('should measure CPU vs GPU performance with large dataset', async () => {
      if (!gpuSupported) {
        return
      }

      const allStocks: BerryStock[] = berries.map((berry) => ({
        berry,
        count: 10,
      }))

      const donut = {
        id: "test-donut",
        name: 'PerfTest',
        flavors: { spicy: 30, fresh: 30, sweet: 30, bitter: 30, sour: 30 },
      }

      // CPU timing
      const cpuStart = performance.now()
      const cpuResult = findRequiredCombinations(donut, allStocks, 6)
      const cpuEnd = performance.now()
      const cpuTime = cpuEnd - cpuStart

      // GPU timing (force GPU)
      const gpuStart = performance.now()
      const gpuResult = await finder.findRecipes(donut, allStocks, 6, {
        forceGPU: true,
      })
      const gpuEnd = performance.now()
      const gpuTime = gpuEnd - gpuStart

      console.log(`CPU: ${cpuTime.toFixed(2)}ms, GPU: ${gpuTime.toFixed(2)}ms`)

      // Results should match
      expect(gpuResult.recipes.length).toBe(cpuResult.recipes.length)

      // Performance logging (no strict assertion as it depends on hardware)
      if (gpuTime < cpuTime) {
        console.log(`GPU was ${((cpuTime / gpuTime) * 100 - 100).toFixed(0)}% faster`)
      } else {
        console.log(`CPU was ${((gpuTime / cpuTime) * 100 - 100).toFixed(0)}% faster`)
      }
    })

    it('should handle batch size limits with real data', async () => {
      const allStocks: BerryStock[] = berries.map((berry) => ({
        berry,
        count: 8,
      }))

      const donut = {
        id: "test-donut",
        name: 'BatchTest',
        flavors: { spicy: 10, fresh: 10, sweet: 10, bitter: 10, sour: 10 },
      }

      const batchSize = 100
      const result = await finder.findRecipes(donut, allStocks, 6, {
        gpuBatchSize: batchSize,
      })

      // Note: CPU implementation doesn't respect batch size, only GPU does
      // This test just verifies the option is accepted
      expect(result.recipes).toBeDefined()
      expect(Array.isArray(result.recipes)).toBe(true)
    })
  })

  describe('Edge cases with real data', () => {
    it('should handle insufficient berries', async () => {
      const stocks: BerryStock[] = berries.slice(0, 1).map((berry) => ({
        berry,
        count: 1,
      }))

      // Require more than 1 berry can provide
      const donut = {
        id: "test-donut",
        name: 'ImpossibleTest',
        flavors: { spicy: 100, fresh: 100, sweet: 100, bitter: 100, sour: 100 },
      }

      const result = await finder.findRecipes(donut, stocks, 3)
      expect(result.recipes.length).toBe(0)
    })

    it('should handle conflicting flavor requirements', async () => {
      // Use berries with specific flavors
      const stocks: BerryStock[] = berries
        .filter((berry) => berry.flavors.spicy > 5)
        .slice(0, 5)
        .map((berry) => ({
          berry,
          count: 5,
        }))

      if (stocks.length === 0) {
        // Skip if no matching berries
        return
      }

      const donut = {
        id: "test-donut",
        name: 'ConflictTest',
        // High requirements across all flavors
        flavors: { spicy: 100, fresh: 100, sweet: 100, bitter: 100, sour: 100 },
      }

      const cpuResult = findRequiredCombinations(donut, stocks, 6)
      const enhancedResult = await finder.findRecipes(donut, stocks, 6)

      expect(enhancedResult.recipes.length).toBe(cpuResult.recipes.length)
    })

    it('should handle berry with zero flavors', async () => {
      // Create a hypothetical berry with no flavors
      const emptyBerry = {
        id: "test-empty-berry",
        name: 'Empty Berry',
        level: 1,
        calories: 60,
        flavors: { spicy: 0, fresh: 0, sweet: 0, bitter: 0, sour: 0 },
        hyper: false,
      }

      const stocks: BerryStock[] = [
        { berry: emptyBerry, count: 10 },
        { berry: berries[0], count: 10 },
      ]

      const donut = {
        id: "test-donut",
        name: 'Test',
        flavors: { spicy: 10, fresh: 0, sweet: 0, bitter: 0, sour: 0 },
      }

      const result = await finder.findRecipes(donut, stocks, 3)

      // Should still find recipes using the non-empty berry
      expect(result.recipes).toBeDefined()
    })
  })

  describe('All donuts compatibility', () => {
    it('should be able to find recipes for simple donut', async () => {
      const allStocks: BerryStock[] = berries.map((berry) => ({
        berry,
        count: 15, // Increase count for high-requirement donuts
      }))

      // Create a simple test donut with moderate requirements
      const simpleDonut = {
        id: "test-testdonut", name: 'TestDonut',
        flavors: { spicy: 50, fresh: 50, sweet: 50, bitter: 50, sour: 50 },
      }

      const result = await finder.findRecipes(simpleDonut, allStocks, 6)

      // Should find at least one valid recipe
      expect(result.recipes.length).toBeGreaterThan(0)

      // Verify first recipe
      if (result.recipes.length > 0) {
        const recipe = result.recipes[0]
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

        expect(totalSpicy).toBeGreaterThanOrEqual(simpleDonut.flavors.spicy)
        expect(totalFresh).toBeGreaterThanOrEqual(simpleDonut.flavors.fresh)
        expect(totalSweet).toBeGreaterThanOrEqual(simpleDonut.flavors.sweet)
        expect(totalBitter).toBeGreaterThanOrEqual(simpleDonut.flavors.bitter)
        expect(totalSour).toBeGreaterThanOrEqual(simpleDonut.flavors.sour)
      }
    })
  })
})
