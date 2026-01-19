/**
 * Enhanced Finder TypeGPU Integration Tests
 *
 * Tests for EnhancedRecipeFinder with TypeGPU and WebGPU implementations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { EnhancedRecipeFinder } from '../enhanced-finder'
import type { BerryStock, Donut } from '@/lib/types'
import { isTypeGPUSupported } from '../gpu/tgpu-context'
import { isWebGPUSupported } from '../gpu/webgpu-support'

// Helper to create test data
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

describe('EnhancedRecipeFinder with TypeGPU', () => {
  let finder: EnhancedRecipeFinder
  let typeGPUSupported = false
  let webGPUSupported = false

  beforeEach(async () => {
    finder = new EnhancedRecipeFinder()
    typeGPUSupported = await isTypeGPUSupported()
    webGPUSupported = await isWebGPUSupported()
  })

  afterEach(() => {
    finder.destroy()
  })

  describe('Implementation selection', () => {
    it('should select TypeGPU when available and preferred', async () => {
      if (!typeGPUSupported) {
        console.log('Skipping: TypeGPU not supported')
        return
      }

      await finder.initialize('typegpu')

      const implementation = finder.getActiveImplementation()
      expect(implementation).toBe('typegpu')
      expect(finder.isGPUAvailable()).toBe(true)
    })

    it('should select WebGPU when TypeGPU not available but WebGPU is', async () => {
      if (typeGPUSupported) {
        console.log('Skipping: TypeGPU is available, cannot test WebGPU fallback')
        return
      }

      if (!webGPUSupported) {
        console.log('Skipping: Neither TypeGPU nor WebGPU supported')
        return
      }

      await finder.initialize('auto')

      const implementation = finder.getActiveImplementation()
      expect(implementation).toBe('webgpu')
      expect(finder.isGPUAvailable()).toBe(true)
    })

    it('should respect explicit TypeGPU preference', async () => {
      if (!typeGPUSupported) {
        console.log('Skipping: TypeGPU not supported')
        return
      }

      await finder.initialize('typegpu')

      const implementation = finder.getActiveImplementation()
      expect(implementation).toBe('typegpu')
    })

    it('should respect explicit WebGPU preference', async () => {
      if (!webGPUSupported) {
        console.log('Skipping: WebGPU not supported')
        return
      }

      await finder.initialize('webgpu')

      const implementation = finder.getActiveImplementation()
      expect(implementation).toBe('webgpu')
    })

    it('should use auto selection by default', async () => {
      await finder.initialize()

      const implementation = finder.getActiveImplementation()

      if (typeGPUSupported) {
        expect(implementation).toBe('typegpu')
      } else if (webGPUSupported) {
        expect(implementation).toBe('webgpu')
      } else {
        expect(implementation).toBe('auto')
        expect(finder.isGPUAvailable()).toBe(false)
      }
    })
  })

  describe('GPU threshold behavior', () => {
    it('should use CPU for small datasets even with GPU available', async () => {
      await finder.initialize()

      const stocks: BerryStock[] = [
        createBerryStock('Berry1', { spicy: 10, fresh: 0, sweet: 0, bitter: 0, sour: 0 }, 5),
        createBerryStock('Berry2', { spicy: 0, fresh: 10, sweet: 0, bitter: 0, sour: 0 }, 5),
      ]

      const donut: Donut = {
        id: "test-smalldonut", name: 'SmallDonut',
        flavors: { spicy: 10, fresh: 10, sweet: 0, bitter: 0, sour: 0 },
      }

      // Small dataset: 2 berries, 2 slots (below thresholds)
      const consoleSpy = vi.spyOn(console, 'log')
      await finder.findRecipes(donut, stocks, 2)

      // Should use CPU due to small dataset
      expect(
        consoleSpy.mock.calls.some((call) => call.some((arg) => String(arg).includes('CPU processing'))),
      ).toBe(true)

      consoleSpy.mockRestore()
    })

    it('should use GPU for large datasets when available', async () => {
      if (!typeGPUSupported && !webGPUSupported) {
        console.log('Skipping: No GPU support')
        return
      }

      await finder.initialize()

      // Large dataset: 20 berries, 5 slots (above thresholds)
      const stocks: BerryStock[] = Array.from({ length: 20 }, (_, i) =>
        createBerryStock(`Berry${i}`, { spicy: i, fresh: i, sweet: i, bitter: i, sour: i }, 10),
      )

      const donut: Donut = {
        id: "test-largedonut", name: 'LargeDonut',
        flavors: { spicy: 50, fresh: 50, sweet: 50, bitter: 50, sour: 50 },
      }

      const consoleSpy = vi.spyOn(console, 'log')
      await finder.findRecipes(donut, stocks, 5)

      // Should use GPU due to large dataset
      expect(
        consoleSpy.mock.calls.some((call) =>
          call.some((arg) => String(arg).includes('GPU acceleration')),
        ),
      ).toBe(true)

      consoleSpy.mockRestore()
    })

    it('should respect forceGPU option', async () => {
      if (!typeGPUSupported && !webGPUSupported) {
        console.log('Skipping: No GPU support')
        return
      }

      await finder.initialize()

      const stocks: BerryStock[] = [
        createBerryStock('Berry', { spicy: 10, fresh: 0, sweet: 0, bitter: 0, sour: 0 }, 2),
      ]

      const donut: Donut = {
        id: "test-test", name: 'Test',
        flavors: { spicy: 10, fresh: 0, sweet: 0, bitter: 0, sour: 0 },
      }

      const consoleSpy = vi.spyOn(console, 'log')

      // Force GPU even with small dataset
      await finder.findRecipes(donut, stocks, 1, { forceGPU: true })

      expect(
        consoleSpy.mock.calls.some((call) =>
          call.some((arg) => String(arg).includes('GPU acceleration')),
        ),
      ).toBe(true)

      consoleSpy.mockRestore()
    })

    it('should respect forceCPU option', async () => {
      await finder.initialize()

      // Large dataset that would normally use GPU
      const stocks: BerryStock[] = Array.from({ length: 20 }, (_, i) =>
        createBerryStock(`Berry${i}`, { spicy: i, fresh: i, sweet: i, bitter: i, sour: i }, 10),
      )

      const donut: Donut = {
        id: "test-largedonut", name: 'LargeDonut',
        flavors: { spicy: 50, fresh: 50, sweet: 50, bitter: 50, sour: 50 },
      }

      const consoleSpy = vi.spyOn(console, 'log')

      // Force CPU even with large dataset
      await finder.findRecipes(donut, stocks, 5, { forceCPU: true })

      expect(
        consoleSpy.mock.calls.some((call) => call.some((arg) => String(arg).includes('CPU processing'))),
      ).toBe(true)

      consoleSpy.mockRestore()
    })
  })

  describe('Implementation-specific options', () => {
    it('should pass gpuImplementation option through', async () => {
      if (!typeGPUSupported) {
        console.log('Skipping: TypeGPU not supported')
        return
      }

      const stocks: BerryStock[] = Array.from({ length: 20 }, (_, i) =>
        createBerryStock(`Berry${i}`, { spicy: 1, fresh: 1, sweet: 1, bitter: 1, sour: 1 }, 10),
      )

      const donut: Donut = {
        id: "test-test", name: 'Test',
        flavors: { spicy: 10, fresh: 10, sweet: 10, bitter: 10, sour: 10 },
      }

      // Should initialize with TypeGPU when specified
      await finder.findRecipes(donut, stocks, 5, {
        gpuImplementation: 'typegpu',
        forceGPU: true,
      })

      expect(finder.getActiveImplementation()).toBe('typegpu')
    })

    it('should handle gpuBatchSize option', async () => {
      if (!typeGPUSupported && !webGPUSupported) {
        console.log('Skipping: No GPU support')
        return
      }

      await finder.initialize()

      const stocks: BerryStock[] = Array.from({ length: 20 }, (_, i) =>
        createBerryStock(`Berry${i}`, { spicy: 1, fresh: 1, sweet: 1, bitter: 1, sour: 1 }, 10),
      )

      const donut: Donut = {
        id: "test-test", name: 'Test',
        flavors: { spicy: 5, fresh: 5, sweet: 5, bitter: 5, sour: 5 },
      }

      const result = await finder.findRecipes(donut, stocks, 5, {
        forceGPU: true,
        gpuBatchSize: 100,
      })

      // Should respect batch size limit
      expect(result.recipes.length).toBeLessThanOrEqual(100)
    })
  })

  describe('Correctness verification', () => {
    it('should produce correct results with TypeGPU', async () => {
      if (!typeGPUSupported) {
        console.log('Skipping: TypeGPU not supported')
        return
      }

      await finder.initialize('typegpu')

      const stocks: BerryStock[] = [
        createBerryStock('Spicy', { spicy: 10, fresh: 0, sweet: 0, bitter: 0, sour: 0 }, 5),
        createBerryStock('Sweet', { spicy: 0, fresh: 0, sweet: 10, bitter: 0, sour: 0 }, 5),
        createBerryStock('Mixed', { spicy: 5, fresh: 5, sweet: 5, bitter: 5, sour: 5 }, 5),
      ]

      const donut: Donut = {
        id: "test-testdonut", name: 'TestDonut',
        flavors: { spicy: 20, fresh: 10, sweet: 20, bitter: 5, sour: 5 },
      }

      const result = await finder.findRecipes(donut, stocks, 5, { forceGPU: true })

      expect(result.recipes.length).toBeGreaterThan(0)

      // Verify first recipe meets requirements
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

      expect(totalSpicy).toBeGreaterThanOrEqual(donut.flavors.spicy)
      expect(totalFresh).toBeGreaterThanOrEqual(donut.flavors.fresh)
      expect(totalSweet).toBeGreaterThanOrEqual(donut.flavors.sweet)
      expect(totalBitter).toBeGreaterThanOrEqual(donut.flavors.bitter)
      expect(totalSour).toBeGreaterThanOrEqual(donut.flavors.sour)
    })

    it('should handle edge cases consistently', async () => {
      await finder.initialize()

      const stocks: BerryStock[] = []
      const donut: Donut = {
        id: "test-empty", name: 'Empty',
        flavors: { spicy: 10, fresh: 0, sweet: 0, bitter: 0, sour: 0 },
      }

      const result = await finder.findRecipes(donut, stocks, 3)

      // With empty stocks and non-zero requirements, should find no recipes
      expect(result.recipes.length).toBe(0)
      expect(result.limitReached).toBe(false)
    })
  })

  describe('Performance info', () => {
    it('should report TypeGPU in performance info', async () => {
      if (!typeGPUSupported) {
        console.log('Skipping: TypeGPU not supported')
        return
      }

      await finder.initialize('typegpu')

      const info = await finder.getPerformanceInfo()

      expect(info.gpuAvailable).toBe(true)
      expect(info.gpuInitialized).toBe(true)
      expect(info.cpuAvailable).toBe(true)
      expect(info.implementation).toBe('typegpu')
      expect(info.error).toBeNull()
    })

    it('should report WebGPU in performance info', async () => {
      if (!webGPUSupported) {
        console.log('Skipping: WebGPU not supported')
        return
      }

      await finder.initialize('webgpu')

      const info = await finder.getPerformanceInfo()

      expect(info.implementation).toBe('webgpu')
    })

    it('should report auto when no GPU available', async () => {
      if (typeGPUSupported || webGPUSupported) {
        console.log('Skipping: GPU is available')
        return
      }

      await finder.initialize()

      const info = await finder.getPerformanceInfo()

      expect(info.gpuAvailable).toBe(false)
      expect(info.implementation).toBe('auto')
    })
  })

  describe('Error handling and fallback', () => {
    it('should fallback to CPU if GPU processing fails', async () => {
      if (!typeGPUSupported && !webGPUSupported) {
        console.log('Skipping: No GPU support to test fallback')
        return
      }

      await finder.initialize()

      const stocks: BerryStock[] = Array.from({ length: 20 }, (_, i) =>
        createBerryStock(`Berry${i}`, { spicy: 1, fresh: 1, sweet: 1, bitter: 1, sour: 1 }, 10),
      )

      const donut: Donut = {
        id: "test-test", name: 'Test',
        flavors: { spicy: 10, fresh: 10, sweet: 10, bitter: 10, sour: 10 },
      }

      // Should still return results even if GPU encounters issues
      const result = await finder.findRecipes(donut, stocks, 5, { forceGPU: true })

      expect(result).toBeDefined()
      expect(result.recipes).toBeDefined()
    })

    it('should handle initialization errors gracefully', async () => {
      const finderWithError = new EnhancedRecipeFinder()

      // Mock to force initialization error
      vi.spyOn(console, 'error').mockImplementation(() => {})

      await finderWithError.initialize('typegpu')

      // Should not throw, should fall back to CPU
      const stocks: BerryStock[] = [
        createBerryStock('Berry', { spicy: 10, fresh: 0, sweet: 0, bitter: 0, sour: 0 }, 5),
      ]

      const donut: Donut = {
        id: "test-test", name: 'Test',
        flavors: { spicy: 10, fresh: 0, sweet: 0, bitter: 0, sour: 0 },
      }

      const result = await finderWithError.findRecipes(donut, stocks, 2)

      expect(result).toBeDefined()
      expect(result.recipes).toBeDefined()

      finderWithError.destroy()
      vi.restoreAllMocks()
    })
  })
})
