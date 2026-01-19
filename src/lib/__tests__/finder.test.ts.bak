import { describe, it, expect } from 'vitest'
import { findRequiredCombinations } from '../finder'
import type { Donut, BerryStock, Berry } from '../types'

describe('findRequiredCombinations', () => {
  // Helper to create a berry
  const createBerry = (
    id: string,
    name: string,
    sweet: number,
    spicy: number,
    sour: number,
    bitter: number,
    fresh: number,
    hyper = false
  ): Berry => ({
    id,
    name,
    level: 1,
    calories: 10,
    flavors: { sweet, spicy, sour, bitter, fresh },
    hyper,
  })

  // Helper to create a donut
  const createDonut = (
    id: string,
    name: string,
    sweet: number,
    spicy: number,
    sour: number,
    bitter: number,
    fresh: number
  ): Donut => ({
    id,
    name,
    flavors: { sweet, spicy, sour, bitter, fresh },
  })

  describe('Basic functionality', () => {
    it('should find a single solution with exact flavor match', () => {
      const donut = createDonut('test-donut', 'Test Donut', 10, 0, 0, 0, 0)
      const berry = createBerry('test-berry', 'Test Berry', 10, 0, 0, 0, 0)
      const stocks: BerryStock[] = [{ berry, count: 5 }]

      const result = findRequiredCombinations(donut, stocks, 1)

      expect(result.recipes).toHaveLength(1)
      expect(result.limitReached).toBe(false)
      expect(result.recipes[0].donut).toEqual(donut)
      expect(result.recipes[0].stocks).toHaveLength(1)
      expect(result.recipes[0].stocks[0].berry).toEqual(berry)
      expect(result.recipes[0].stocks[0].count).toBe(1)
    })

    it('should find multiple solutions when multiple combinations exist', () => {
      const donut = createDonut('test-donut', 'Test Donut', 10, 0, 0, 0, 0)
      const berry1 = createBerry('berry-1', 'Berry 1', 5, 0, 0, 0, 0)
      const berry2 = createBerry('berry-2', 'Berry 2', 10, 0, 0, 0, 0)
      const stocks: BerryStock[] = [
        { berry: berry1, count: 5 },
        { berry: berry2, count: 5 },
      ]

      const result = findRequiredCombinations(donut, stocks, 2)

      expect(result.recipes.length).toBeGreaterThan(0)
      expect(result.limitReached).toBe(false)

      // All solutions should meet the requirements
      for (const recipe of result.recipes) {
        let totalSweet = 0
        for (const stock of recipe.stocks) {
          totalSweet += stock.berry.flavors.sweet * stock.count
        }
        expect(totalSweet).toBeGreaterThanOrEqual(10)
      }
    })

    it('should find solutions that exceed requirements', () => {
      const donut = createDonut('test-donut', 'Test Donut', 5, 0, 0, 0, 0)
      const berry = createBerry('test-berry', 'Test Berry', 10, 0, 0, 0, 0)
      const stocks: BerryStock[] = [{ berry, count: 5 }]

      const result = findRequiredCombinations(donut, stocks, 1)

      expect(result.recipes).toHaveLength(1)
      expect(result.recipes[0].stocks[0].count).toBe(1)

      const totalSweet = result.recipes[0].stocks[0].berry.flavors.sweet * result.recipes[0].stocks[0].count
      expect(totalSweet).toBeGreaterThanOrEqual(5)
    })

    it('should return empty array when no solution exists', () => {
      const donut = createDonut('test-donut', 'Test Donut', 100, 0, 0, 0, 0)
      const berry = createBerry('test-berry', 'Test Berry', 1, 0, 0, 0, 0)
      const stocks: BerryStock[] = [{ berry, count: 5 }]

      const result = findRequiredCombinations(donut, stocks, 2)

      expect(result.recipes).toHaveLength(0)
      expect(result.limitReached).toBe(false)
    })
  })

  describe('Edge cases', () => {
    it('should handle empty stocks array', () => {
      const donut = createDonut('test-donut', 'Test Donut', 10, 0, 0, 0, 0)
      const stocks: BerryStock[] = []

      const result = findRequiredCombinations(donut, stocks, 3)

      expect(result.recipes).toHaveLength(0)
      expect(result.limitReached).toBe(false)
    })

    it('should handle zero slots', () => {
      const donut = createDonut('test-donut', 'Test Donut', 0, 0, 0, 0, 0)
      const berry = createBerry('test-berry', 'Test Berry', 10, 0, 0, 0, 0)
      const stocks: BerryStock[] = [{ berry, count: 5 }]

      const result = findRequiredCombinations(donut, stocks, 0)

      // With zero slots, we can only find a solution if the requirement is also zero
      expect(result.recipes).toHaveLength(1)
      expect(result.recipes[0].stocks).toHaveLength(0)
    })

    it('should handle single berry single slot', () => {
      const donut = createDonut('test-donut', 'Test Donut', 10, 0, 0, 0, 0)
      const berry = createBerry('test-berry', 'Test Berry', 10, 0, 0, 0, 0)
      const stocks: BerryStock[] = [{ berry, count: 1 }]

      const result = findRequiredCombinations(donut, stocks, 1)

      expect(result.recipes).toHaveLength(1)
      expect(result.recipes[0].stocks).toHaveLength(1)
      expect(result.recipes[0].stocks[0].count).toBe(1)
    })

    it('should handle zero berry stock count', () => {
      const donut = createDonut('test-donut', 'Test Donut', 10, 0, 0, 0, 0)
      const berry = createBerry('test-berry', 'Test Berry', 10, 0, 0, 0, 0)
      const stocks: BerryStock[] = [{ berry, count: 0 }]

      const result = findRequiredCombinations(donut, stocks, 3)

      expect(result.recipes).toHaveLength(0)
      expect(result.limitReached).toBe(false)
    })

    it('should handle all zero flavors in requirements', () => {
      const donut = createDonut('test-donut', 'Test Donut', 0, 0, 0, 0, 0)
      const berry = createBerry('test-berry', 'Test Berry', 10, 5, 3, 2, 1)
      const stocks: BerryStock[] = [{ berry, count: 5 }]

      const result = findRequiredCombinations(donut, stocks, 3)

      // Should find solutions since any combination meets zero requirements
      expect(result.recipes.length).toBeGreaterThan(0)
    })
  })

  describe('Multi-flavor combinations', () => {
    it('should find recipes with multiple required flavors', () => {
      const donut = createDonut('test-donut', 'Test Donut', 10, 5, 0, 0, 0)
      const berry1 = createBerry('berry-1', 'Berry 1', 10, 0, 0, 0, 0)
      const berry2 = createBerry('berry-2', 'Berry 2', 0, 5, 0, 0, 0)
      const stocks: BerryStock[] = [
        { berry: berry1, count: 5 },
        { berry: berry2, count: 5 },
      ]

      const result = findRequiredCombinations(donut, stocks, 2)

      expect(result.recipes.length).toBeGreaterThan(0)

      // Verify that at least one solution uses both berries
      const hasMultiBerry = result.recipes.some(recipe => recipe.stocks.length === 2)
      expect(hasMultiBerry).toBe(true)
    })

    it('should handle all five flavors', () => {
      const donut = createDonut('test-donut', 'Test Donut', 5, 5, 5, 5, 5)
      const berry = createBerry('test-berry', 'Test Berry', 5, 5, 5, 5, 5)
      const stocks: BerryStock[] = [{ berry, count: 10 }]

      const result = findRequiredCombinations(donut, stocks, 1)

      expect(result.recipes).toHaveLength(1)
      expect(result.recipes[0].stocks[0].count).toBe(1)
    })
  })

  describe('Solution limits', () => {
    it('should respect MAX_SOLUTIONS limit', () => {
      // Create a scenario with many small-value berries that need to be combined
      // This generates many possible combinations
      const donut = createDonut('test-donut', 'Test Donut', 3, 0, 0, 0, 0)
      const stocks: BerryStock[] = []

      // Create 15 different berries with small sweet values
      for (let i = 0; i < 15; i++) {
        const berry = createBerry(`berry-${i}`, `Berry ${i}`, 1, 0, 0, 0, 0)
        stocks.push({ berry, count: 10 })
      }

      const result = findRequiredCombinations(donut, stocks, 10)

      // Should hit the limit of 10000 solutions
      expect(result.recipes.length).toBeLessThanOrEqual(10000)
      // With 15 berries, slots=10, requirement=3, this should generate many combinations
      if (result.recipes.length >= 10000) {
        expect(result.limitReached).toBe(true)
      } else {
        // Accepted - the combination might not reach the limit depending on pruning efficiency
        expect(result.limitReached).toBe(false)
      }
    })

    it('should not set limitReached for small result sets', () => {
      const donut = createDonut('test-donut', 'Test Donut', 10, 0, 0, 0, 0)
      const berry = createBerry('test-berry', 'Test Berry', 10, 0, 0, 0, 0)
      const stocks: BerryStock[] = [{ berry, count: 3 }]

      const result = findRequiredCombinations(donut, stocks, 2)

      expect(result.limitReached).toBe(false)
    })
  })

  describe('Slot usage', () => {
    it('should respect slot limits', () => {
      const donut = createDonut('test-donut', 'Test Donut', 20, 0, 0, 0, 0)
      const berry = createBerry('test-berry', 'Test Berry', 5, 0, 0, 0, 0)
      const stocks: BerryStock[] = [{ berry, count: 10 }]

      const result = findRequiredCombinations(donut, stocks, 3)

      // All recipes should use at most 3 berries total
      for (const recipe of result.recipes) {
        const totalUsed = recipe.stocks.reduce((sum, stock) => sum + stock.count, 0)
        expect(totalUsed).toBeLessThanOrEqual(3)
      }
    })

    it('should use exactly the number of slots needed', () => {
      const donut = createDonut('test-donut', 'Test Donut', 10, 0, 0, 0, 0)
      const berry = createBerry('test-berry', 'Test Berry', 5, 0, 0, 0, 0)
      const stocks: BerryStock[] = [{ berry, count: 10 }]

      const result = findRequiredCombinations(donut, stocks, 5)

      expect(result.recipes.length).toBeGreaterThan(0)

      // Should find a solution using exactly 2 berries (2 * 5 = 10)
      const exactSolution = result.recipes.find(recipe =>
        recipe.stocks.reduce((sum, stock) => sum + stock.count, 0) === 2
      )
      expect(exactSolution).toBeDefined()
    })
  })

  describe('Berry stock constraints', () => {
    it('should not exceed available berry stock', () => {
      const donut = createDonut('test-donut', 'Test Donut', 50, 0, 0, 0, 0)
      const berry = createBerry('test-berry', 'Test Berry', 10, 0, 0, 0, 0)
      const stocks: BerryStock[] = [{ berry, count: 3 }]

      const result = findRequiredCombinations(donut, stocks, 10)

      // All recipes should use at most 3 of this berry
      for (const recipe of result.recipes) {
        for (const stock of recipe.stocks) {
          expect(stock.count).toBeLessThanOrEqual(3)
        }
      }
    })

    it('should work with multiple berries of different stocks', () => {
      const donut = createDonut('test-donut', 'Test Donut', 15, 0, 0, 0, 0)
      const berry1 = createBerry('berry-1', 'Berry 1', 5, 0, 0, 0, 0)
      const berry2 = createBerry('berry-2', 'Berry 2', 10, 0, 0, 0, 0)
      const stocks: BerryStock[] = [
        { berry: berry1, count: 2 },
        { berry: berry2, count: 3 },
      ]

      const result = findRequiredCombinations(donut, stocks, 3)

      expect(result.recipes.length).toBeGreaterThan(0)

      // Verify stock constraints
      for (const recipe of result.recipes) {
        for (const stock of recipe.stocks) {
          if (stock.berry.id === 'berry-1') {
            expect(stock.count).toBeLessThanOrEqual(2)
          } else if (stock.berry.id === 'berry-2') {
            expect(stock.count).toBeLessThanOrEqual(3)
          }
        }
      }
    })
  })

  describe('Performance and pruning', () => {
    it('should complete quickly even with many berries', () => {
      const donut = createDonut('test-donut', 'Test Donut', 50, 0, 0, 0, 0)
      const stocks: BerryStock[] = []

      // Create 20 different berries
      for (let i = 0; i < 20; i++) {
        const berry = createBerry(`berry-${i}`, `Berry ${i}`, 5 + i, 0, 0, 0, 0)
        stocks.push({ berry, count: 3 })
      }

      const startTime = performance.now()
      const result = findRequiredCombinations(donut, stocks, 5)
      const duration = performance.now() - startTime

      expect(result.recipes.length).toBeGreaterThan(0)
      // Should complete within reasonable time (less than 5 seconds)
      expect(duration).toBeLessThan(5000)
    })

    it('should prune impossible branches efficiently', () => {
      const donut = createDonut('test-donut', 'Test Donut', 1000, 0, 0, 0, 0)
      const berry = createBerry('test-berry', 'Test Berry', 1, 0, 0, 0, 0)
      const stocks: BerryStock[] = [{ berry, count: 5 }]

      const startTime = performance.now()
      const result = findRequiredCombinations(donut, stocks, 5)
      const duration = performance.now() - startTime

      expect(result.recipes).toHaveLength(0)
      // Should complete very quickly due to pruning (less than 100ms)
      expect(duration).toBeLessThan(100)
    })
  })

  describe('Real-world scenarios', () => {
    it('should handle typical Pokemon ZA donut recipe search', () => {
      // Simulate a real donut requirement
      const donut = createDonut('plain-donut', 'Plain Donut', 80, 0, 0, 0, 0)

      // Simulate typical berries
      const oranBerry = createBerry('oran-berry', 'Oran Berry', 10, 10, 0, 10, 0)
      const pechaBerry = createBerry('pecha-berry', 'Pecha Berry', 0, 10, 10, 0, 10)
      const chestoBerry = createBerry('chesto-berry', 'Chesto Berry', 10, 0, 0, 10, 10)

      const stocks: BerryStock[] = [
        { berry: oranBerry, count: 10 },
        { berry: pechaBerry, count: 5 },
        { berry: chestoBerry, count: 8 },
      ]

      const result = findRequiredCombinations(donut, stocks, 8)

      expect(result.recipes.length).toBeGreaterThan(0)

      // Verify all recipes are valid
      for (const recipe of result.recipes) {
        let totalSweet = 0
        let totalUsed = 0

        for (const stock of recipe.stocks) {
          totalSweet += stock.berry.flavors.sweet * stock.count
          totalUsed += stock.count
        }

        expect(totalSweet).toBeGreaterThanOrEqual(80)
        expect(totalUsed).toBeLessThanOrEqual(8)
      }
    })
  })
})
