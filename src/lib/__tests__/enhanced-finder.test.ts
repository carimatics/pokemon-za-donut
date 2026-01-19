import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { EnhancedRecipeFinder, createEnhancedFinder } from '../enhanced-finder'
import type { Berry, BerryStock, Donut } from '../types'

// Mock TypeGPU support check
vi.mock('../gpu/tgpu-context', () => ({
  isTypeGPUSupported: vi.fn().mockResolvedValue(false),
}))

describe('EnhancedRecipeFinder', () => {
  let finder: EnhancedRecipeFinder

  beforeEach(() => {
    finder = new EnhancedRecipeFinder()
    vi.clearAllMocks()
  })

  afterEach(() => {
    finder.destroy()
  })

  // Helper functions
  const createBerry = (
    id: string,
    name: string,
    spicy = 0,
    fresh = 0,
    sweet = 0,
    bitter = 0,
    sour = 0,
    hyper = false,
  ): Berry => ({
    id,
    name,
    level: 1,
    calories: 10,
    flavors: { spicy, fresh, sweet, bitter, sour },
    hyper,
  })

  const createDonut = (
    id: string,
    name: string,
    spicy = 0,
    fresh = 0,
    sweet = 0,
    bitter = 0,
    sour = 0,
  ): Donut => ({
    id,
    name,
    flavors: { spicy, fresh, sweet, bitter, sour },
  })

  describe('initialize', () => {
    it('should initialize successfully without GPU', async () => {
      await finder.initialize()

      expect(finder.isGPUAvailable()).toBe(false)
    })

    it('should not initialize twice', async () => {
      await finder.initialize()
      await finder.initialize()

      expect(finder.isGPUAvailable()).toBe(false)
    })

    it('should handle initialization errors gracefully', async () => {
      const tgpuContext = await import('../gpu/tgpu-context')
      vi.mocked(tgpuContext.isTypeGPUSupported).mockRejectedValueOnce(new Error('GPU init failed'))

      await finder.initialize()

      expect(finder.isGPUAvailable()).toBe(false)
      expect(finder.getInitializationError()).toBeTruthy()
    })
  })

  describe('findRecipes', () => {
    it('should find recipes using CPU', async () => {
      const berry1 = createBerry('1', 'Berry1', 10, 0, 0, 0, 0)
      const berry2 = createBerry('2', 'Berry2', 0, 10, 0, 0, 0)
      const stocks: BerryStock[] = [
        { berry: berry1, count: 5 },
        { berry: berry2, count: 5 },
      ]
      const donut = createDonut('d1', 'Donut1', 10, 0, 0, 0, 0)

      const result = await finder.findRecipes(donut, stocks, 3)

      expect(result).toBeDefined()
      expect(result.recipes).toBeDefined()
      expect(Array.isArray(result.recipes)).toBe(true)
      expect(typeof result.limitReached).toBe('boolean')
    })

    it('should auto-initialize if not initialized', async () => {
      const berry = createBerry('1', 'Berry1', 10, 10, 10, 10, 10)
      const stocks: BerryStock[] = [{ berry, count: 5 }]
      const donut = createDonut('d1', 'Donut1', 5, 5, 5, 5, 5)

      const result = await finder.findRecipes(donut, stocks, 2)

      expect(result).toBeDefined()
    })

    it('should use CPU when forceCPU option is set', async () => {
      await finder.initialize()

      const berry = createBerry('1', 'Berry1', 10, 10, 10, 10, 10)
      const stocks: BerryStock[] = [{ berry, count: 5 }]
      const donut = createDonut('d1', 'Donut1', 5, 5, 5, 5, 5)

      const result = await finder.findRecipes(donut, stocks, 2, { forceCPU: true })

      expect(result).toBeDefined()
      expect(finder.isGPUAvailable()).toBe(false)
    })

    it('should handle empty stocks', async () => {
      const donut = createDonut('d1', 'Donut1', 10, 10, 10, 10, 10)

      const result = await finder.findRecipes(donut, [], 5)

      expect(result.recipes).toEqual([])
      expect(result.limitReached).toBe(false)
    })

    it('should handle zero slots', async () => {
      const berry = createBerry('1', 'Berry1', 10, 10, 10, 10, 10)
      const stocks: BerryStock[] = [{ berry, count: 5 }]
      const donut = createDonut('d1', 'Donut1', 5, 5, 5, 5, 5)

      const result = await finder.findRecipes(donut, stocks, 0)

      expect(result.recipes).toEqual([])
      expect(result.limitReached).toBe(false)
    })

    it('should find multiple valid recipes', async () => {
      const berry1 = createBerry('1', 'Berry1', 10, 0, 0, 0, 0)
      const berry2 = createBerry('2', 'Berry2', 5, 5, 0, 0, 0)
      const stocks: BerryStock[] = [
        { berry: berry1, count: 3 },
        { berry: berry2, count: 3 },
      ]
      const donut = createDonut('d1', 'Donut1', 10, 0, 0, 0, 0)

      const result = await finder.findRecipes(donut, stocks, 2)

      // Should find at least the combination of 1x berry1
      expect(result.recipes.length).toBeGreaterThan(0)
    })
  })

  describe('isGPUAvailable', () => {
    it('should return false initially', () => {
      expect(finder.isGPUAvailable()).toBe(false)
    })

    it('should return false after CPU-only initialization', async () => {
      await finder.initialize()

      expect(finder.isGPUAvailable()).toBe(false)
    })
  })

  describe('getInitializationError', () => {
    it('should return null initially', () => {
      expect(finder.getInitializationError()).toBeNull()
    })

    it('should return null after successful initialization', async () => {
      await finder.initialize()

      expect(finder.getInitializationError()).toBeNull()
    })
  })

  describe('getPerformanceInfo', () => {
    it('should return performance info', async () => {
      const info = await finder.getPerformanceInfo()

      expect(info).toBeDefined()
      expect(info.cpuAvailable).toBe(true)
      expect(typeof info.gpuAvailable).toBe('boolean')
      expect(typeof info.gpuInitialized).toBe('boolean')
    })

    it('should auto-initialize when getting performance info', async () => {
      const newFinder = new EnhancedRecipeFinder()

      const info = await newFinder.getPerformanceInfo()

      expect(info.gpuInitialized).toBe(true)

      newFinder.destroy()
    })
  })

  describe('destroy', () => {
    it('should clean up resources', () => {
      finder.destroy()

      expect(finder.isGPUAvailable()).toBe(false)
    })

    it('should be safe to call multiple times', () => {
      finder.destroy()
      finder.destroy()

      expect(finder.isGPUAvailable()).toBe(false)
    })
  })

  describe('createEnhancedFinder', () => {
    it('should create and initialize finder by default', async () => {
      const newFinder = await createEnhancedFinder()

      expect(newFinder).toBeDefined()
      expect(newFinder instanceof EnhancedRecipeFinder).toBe(true)

      newFinder.destroy()
    })

    it('should create finder without initialization when autoInitialize is false', async () => {
      const newFinder = await createEnhancedFinder(false)

      expect(newFinder).toBeDefined()

      newFinder.destroy()
    })
  })

  describe('GPU threshold logic', () => {
    it('should not use GPU with small datasets', async () => {
      // Create a small dataset (< 20 berries, < 5 slots)
      const berries = Array.from({ length: 10 }, (_, i) =>
        createBerry(`${i}`, `Berry${i}`, 1, 1, 1, 1, 1),
      )
      const stocks: BerryStock[] = berries.map((berry) => ({ berry, count: 1 }))
      const donut = createDonut('d1', 'Donut1', 5, 5, 5, 5, 5)

      await finder.initialize()
      const result = await finder.findRecipes(donut, stocks, 3)

      expect(result).toBeDefined()
      // CPU should be used for small datasets
    })

    it('should consider using GPU with large datasets', async () => {
      // Create a large dataset (>= 20 berries, >= 5 slots)
      const berries = Array.from({ length: 25 }, (_, i) =>
        createBerry(`${i}`, `Berry${i}`, 1, 1, 1, 1, 1),
      )
      const stocks: BerryStock[] = berries.map((berry) => ({ berry, count: 2 }))
      const donut = createDonut('d1', 'Donut1', 10, 10, 10, 10, 10)

      await finder.initialize()
      const result = await finder.findRecipes(donut, stocks, 6)

      expect(result).toBeDefined()
      // Would use GPU if available
    })
  })

  describe('error handling', () => {
    it('should handle finder errors gracefully', async () => {
      const berry = createBerry('1', 'Berry1', 10, 10, 10, 10, 10)
      const stocks: BerryStock[] = [{ berry, count: 5 }]
      const donut = createDonut('d1', 'Donut1', 5, 5, 5, 5, 5)

      // Should not throw even if there are internal errors
      const result = await finder.findRecipes(donut, stocks, 3)

      expect(result).toBeDefined()
    })
  })
})
