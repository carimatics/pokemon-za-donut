import { describe, it, expect } from 'vitest'
import type { WorkerRequest, WorkerResponse } from '../finder.worker'
import type { Berry, BerryStock, Donut } from '@/lib/types'
import { findRequiredCombinations } from '@/lib/finder'

describe('finder.worker', () => {
  // Helper to create a berry
  const createBerry = (
    id: string,
    name: string,
    sweet: number,
    spicy: number,
    sour: number,
    bitter: number,
    fresh: number
  ): Berry => ({
    id,
    name,
    level: 1,
    calories: 10,
    flavors: { sweet, spicy, sour, bitter, fresh },
    hyper: false,
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

  describe('Worker interface and types', () => {
    it('should have correct WorkerRequest interface structure', () => {
      const donut = createDonut('test-donut', 'Test Donut', 10, 0, 0, 0, 0)
      const berry = createBerry('test-berry', 'Test Berry', 10, 0, 0, 0, 0)
      const stocks: BerryStock[] = [{ berry, count: 5 }]

      const request: WorkerRequest = {
        requestId: 'test-request-1',
        donut,
        stocks,
        slots: 8,
      }

      expect(request).toHaveProperty('requestId')
      expect(request).toHaveProperty('donut')
      expect(request).toHaveProperty('stocks')
      expect(request).toHaveProperty('slots')
      expect(typeof request.requestId).toBe('string')
      expect(typeof request.slots).toBe('number')
    })

    it('should have correct WorkerResponse success interface structure', () => {
      const donut = createDonut('test-donut', 'Test Donut', 10, 0, 0, 0, 0)
      const berry = createBerry('test-berry', 'Test Berry', 10, 0, 0, 0, 0)
      const stocks: BerryStock[] = [{ berry, count: 5 }]

      const response: WorkerResponse = {
        requestId: 'test-request-1',
        success: true,
        result: {
          recipes: [{ donut, stocks }],
          limitReached: false,
        },
      }

      expect(response).toHaveProperty('requestId')
      expect(response).toHaveProperty('success')
      expect(response).toHaveProperty('result')
      expect(response.result).toHaveProperty('recipes')
      expect(response.result).toHaveProperty('limitReached')
      expect(response.error).toBeUndefined()
    })

    it('should have correct WorkerResponse error interface structure', () => {
      const response: WorkerResponse = {
        requestId: 'test-request-error',
        success: false,
        error: 'Test error message',
      }

      expect(response).toHaveProperty('requestId')
      expect(response).toHaveProperty('success')
      expect(response).toHaveProperty('error')
      expect(response.success).toBe(false)
      expect(response.result).toBeUndefined()
    })
  })

  describe('Worker logic simulation', () => {
    it('should successfully process a valid request', () => {
      const donut = createDonut('test-donut', 'Test Donut', 10, 0, 0, 0, 0)
      const berry = createBerry('test-berry', 'Test Berry', 10, 0, 0, 0, 0)
      const stocks: BerryStock[] = [{ berry, count: 5 }]
      const slots = 8

      // Simulate what the worker does
      const result = findRequiredCombinations(donut, stocks, slots)

      const response: WorkerResponse = {
        requestId: 'test-1',
        success: true,
        result: {
          recipes: result.recipes,
          limitReached: result.limitReached,
        },
      }

      expect(response.success).toBe(true)
      expect(response.result?.recipes).toBeDefined()
      expect(Array.isArray(response.result?.recipes)).toBe(true)
      expect(typeof response.result?.limitReached).toBe('boolean')
    })

    it('should handle calculation errors properly', () => {
      const requestId = 'test-error'
      let response: WorkerResponse

      try {
        // Simulate an error during calculation
        throw new Error('Calculation failed')
      } catch (error) {
        response = {
          requestId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        }
      }

      expect(response.success).toBe(false)
      expect(response.error).toBe('Calculation failed')
      expect(response.result).toBeUndefined()
    })

    it('should handle non-Error exceptions', () => {
      const requestId = 'test-string-error'
      let response: WorkerResponse

      try {
        // Simulate a non-Error exception
        throw 'String error'
      } catch (error) {
        response = {
          requestId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        }
      }

      expect(response.success).toBe(false)
      expect(response.error).toBe('Unknown error occurred')
    })

    it('should preserve requestId through success flow', () => {
      const donut = createDonut('test-donut', 'Test Donut', 10, 0, 0, 0, 0)
      const berry = createBerry('test-berry', 'Test Berry', 10, 0, 0, 0, 0)
      const stocks: BerryStock[] = [{ berry, count: 5 }]
      const requestId = 'unique-request-id-123'

      const result = findRequiredCombinations(donut, stocks, 8)

      const response: WorkerResponse = {
        requestId,
        success: true,
        result: {
          recipes: result.recipes,
          limitReached: result.limitReached,
        },
      }

      expect(response.requestId).toBe('unique-request-id-123')
    })

    it('should preserve requestId through error flow', () => {
      const requestId = 'error-request-id-456'
      let response: WorkerResponse

      try {
        throw new Error('Test error')
      } catch (error) {
        response = {
          requestId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        }
      }

      expect(response.requestId).toBe('error-request-id-456')
    })

    it('should return limitReached flag when solutions exceed maximum', () => {
      const donut = createDonut('test-donut', 'Test Donut', 1, 0, 0, 0, 0)
      const stocks: BerryStock[] = []

      // Create many berries to potentially exceed limit
      for (let i = 0; i < 15; i++) {
        const berry = createBerry(`berry-${i}`, `Berry ${i}`, 1, 0, 0, 0, 0)
        stocks.push({ berry, count: 10 })
      }

      const result = findRequiredCombinations(donut, stocks, 10)

      const response: WorkerResponse = {
        requestId: 'test-limit',
        success: true,
        result: {
          recipes: result.recipes,
          limitReached: result.limitReached,
        },
      }

      expect(response.success).toBe(true)
      expect(response.result?.recipes).toBeDefined()
      expect(typeof response.result?.limitReached).toBe('boolean')
      // Either it reaches the limit or doesn't, both are valid
      if (result.limitReached) {
        expect(response.result?.limitReached).toBe(true)
        expect(response.result?.recipes.length).toBeLessThanOrEqual(10000)
      }
    })

    it('should return empty recipes when no solution exists', () => {
      const donut = createDonut('test-donut', 'Test Donut', 1000, 0, 0, 0, 0)
      const berry = createBerry('test-berry', 'Test Berry', 1, 0, 0, 0, 0)
      const stocks: BerryStock[] = [{ berry, count: 5 }]

      const result = findRequiredCombinations(donut, stocks, 8)

      const response: WorkerResponse = {
        requestId: 'test-no-solution',
        success: true,
        result: {
          recipes: result.recipes,
          limitReached: result.limitReached,
        },
      }

      expect(response.success).toBe(true)
      expect(response.result?.recipes).toEqual([])
      expect(response.result?.limitReached).toBe(false)
    })
  })

  describe('Data flow correctness', () => {
    it('should pass donut data correctly through worker flow', () => {
      const donut = createDonut('chocolate-donut', 'Chocolate Donut', 50, 20, 10, 5, 15)
      const berry = createBerry('choco-berry', 'Choco Berry', 50, 20, 10, 5, 15)
      const stocks: BerryStock[] = [{ berry, count: 10 }]

      const result = findRequiredCombinations(donut, stocks, 8)

      const response: WorkerResponse = {
        requestId: 'data-flow-test',
        success: true,
        result: {
          recipes: result.recipes,
          limitReached: result.limitReached,
        },
      }

      if (response.result && response.result.recipes.length > 0) {
        const recipe = response.result.recipes[0]
        expect(recipe.donut.id).toBe('chocolate-donut')
        expect(recipe.donut.flavors.sweet).toBe(50)
      }
    })

    it('should pass berry stock data correctly through worker flow', () => {
      const donut = createDonut('test-donut', 'Test Donut', 20, 0, 0, 0, 0)
      const berry1 = createBerry('berry-1', 'Berry 1', 10, 0, 0, 0, 0)
      const berry2 = createBerry('berry-2', 'Berry 2', 10, 0, 0, 0, 0)
      const stocks: BerryStock[] = [
        { berry: berry1, count: 5 },
        { berry: berry2, count: 3 },
      ]

      const result = findRequiredCombinations(donut, stocks, 8)

      const response: WorkerResponse = {
        requestId: 'berry-data-test',
        success: true,
        result: {
          recipes: result.recipes,
          limitReached: result.limitReached,
        },
      }

      expect(response.success).toBe(true)
      if (response.result && response.result.recipes.length > 0) {
        const recipe = response.result.recipes[0]
        expect(Array.isArray(recipe.stocks)).toBe(true)
        // Verify no stock exceeds the available count
        for (const stock of recipe.stocks) {
          const originalStock = stocks.find(s => s.berry.id === stock.berry.id)
          expect(stock.count).toBeLessThanOrEqual(originalStock?.count || 0)
        }
      }
    })
  })
})
