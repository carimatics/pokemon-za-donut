import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useRecipeFinder } from '../useRecipeFinder'
import type { DonutRecipe } from '@/lib/types'

// Mock the finder module
vi.mock('@/lib/finder', () => ({
  findRequiredCombinations: vi.fn(),
}))

// Mock data modules
vi.mock('@/data/berries', () => ({
  berries: [
    {
      id: 'oran-berry',
      name: 'オレンのみ',
      level: 1,
      calories: 20,
      flavors: { sweet: 10, spicy: 0, sour: 0, bitter: 0, fresh: 0 },
      hyper: false,
    },
    {
      id: 'pecha-berry',
      name: 'モモンのみ',
      level: 1,
      calories: 20,
      flavors: { sweet: 0, spicy: 10, sour: 0, bitter: 0, fresh: 0 },
      hyper: false,
    },
    {
      id: 'high-flavor-berry',
      name: 'ハイフレーバーベリー',
      level: 10,
      calories: 100,
      flavors: { sweet: 30, spicy: 30, sour: 30, bitter: 30, fresh: 0 },
      hyper: false,
    },
  ],
}))

vi.mock('@/data/donuts', () => ({
  donuts: [
    {
      id: 'plain-donut',
      name: 'プレーンドーナツ',
      flavors: { sweet: 100, spicy: 0, sour: 0, bitter: 0, fresh: 0 },
    },
  ],
}))

import { findRequiredCombinations } from '@/lib/finder'
import { berries } from '@/data/berries'

const mockFindRequiredCombinations = findRequiredCombinations as ReturnType<typeof vi.fn>

describe('useRecipeFinder', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useRecipeFinder())

    expect(result.current.recipes.size).toBe(0)
    expect(result.current.recipeRows).toEqual([])
    expect(result.current.isSearching).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.warning).toBeNull()
  })

  it('should handle finding recipes successfully', async () => {
    const mockRecipe: DonutRecipe = {
      donut: {
        id: 'plain-donut',
        name: 'プレーンドーナツ',
        flavors: { sweet: 100, spicy: 0, sour: 0, bitter: 0, fresh: 0 },
      },
      stocks: [
        {
          berry: berries[0],
          count: 5,
        },
      ],
    }

    mockFindRequiredCombinations.mockReturnValue({
      recipes: [mockRecipe],
      limitReached: false,
    })

    const { result } = renderHook(() => useRecipeFinder())

    const selectedDonuts = new Set(['plain-donut'])
    const berryStocks = { 'oran-berry': 10 }
    const slots = 3

    await act(async () => {
      await result.current.handleFindRecipes(selectedDonuts, berryStocks, slots)
    })

    await waitFor(
      () => {
        expect(result.current.isSearching).toBe(false)
        expect(result.current.recipes.size).toBeGreaterThan(0)
      },
      { timeout: 3000 }
    )

    expect(result.current.recipeRows.length).toBeGreaterThan(0)
    expect(result.current.error).toBeNull()
  })

  it('should set error when no berries are selected', async () => {
    const { result } = renderHook(() => useRecipeFinder())

    const selectedDonuts = new Set(['plain-donut'])
    const berryStocks = {} // No berries
    const slots = 3

    await act(async () => {
      try {
        await result.current.handleFindRecipes(selectedDonuts, berryStocks, slots)
      } catch {
        // Expected to throw
      }
    })

    await waitFor(() => {
      expect(result.current.isSearching).toBe(false)
      expect(result.current.error).not.toBeNull()
    })

    expect(result.current.error).toContain('きのみが選択されていません')
  })

  it('should set error when no donuts are selected', async () => {
    const { result } = renderHook(() => useRecipeFinder())

    const selectedDonuts = new Set<string>() // No donuts
    const berryStocks = { 'oran-berry': 10 }
    const slots = 3

    await act(async () => {
      try {
        await result.current.handleFindRecipes(selectedDonuts, berryStocks, slots)
      } catch {
        // Expected to throw
      }
    })

    await waitFor(() => {
      expect(result.current.isSearching).toBe(false)
    })

    expect(result.current.error).toContain('ドーナツが選択されていません')
  })

  it('should set warning when recipe limit is reached', async () => {
    const mockRecipe: DonutRecipe = {
      donut: {
        id: 'plain-donut',
        name: 'プレーンドーナツ',
        flavors: { sweet: 100, spicy: 0, sour: 0, bitter: 0, fresh: 0 },
      },
      stocks: [
        {
          berry: berries[0],
          count: 5,
        },
      ],
    }

    mockFindRequiredCombinations.mockReturnValue({
      recipes: [mockRecipe],
      limitReached: true, // Limit reached
    })

    const { result } = renderHook(() => useRecipeFinder())

    const selectedDonuts = new Set(['plain-donut'])
    const berryStocks = { 'oran-berry': 10 }
    const slots = 3

    await act(async () => {
      await result.current.handleFindRecipes(selectedDonuts, berryStocks, slots)
    })

    await waitFor(() => {
      expect(result.current.isSearching).toBe(false)
      expect(result.current.warning).not.toBeNull()
    })

    expect(result.current.warning).toContain('プレーンドーナツ')
    expect(result.current.warning).toContain('最初の')
  })

  it('should calculate recipe rows correctly', async () => {
    const mockRecipe: DonutRecipe = {
      donut: {
        id: 'plain-donut',
        name: 'プレーンドーナツ',
        flavors: { sweet: 100, spicy: 0, sour: 0, bitter: 0, fresh: 0 },
      },
      stocks: [
        {
          berry: berries[0], // オレンのみ: level=1, calories=20, sweet=10
          count: 5,
        },
        {
          berry: berries[1], // モモンのみ: level=1, calories=20, spicy=10
          count: 3,
        },
      ],
    }

    mockFindRequiredCombinations.mockReturnValue({
      recipes: [mockRecipe],
      limitReached: false,
    })

    const { result } = renderHook(() => useRecipeFinder())

    const selectedDonuts = new Set(['plain-donut'])
    const berryStocks = { 'oran-berry': 10, 'pecha-berry': 10 }
    const slots = 3

    await act(async () => {
      await result.current.handleFindRecipes(selectedDonuts, berryStocks, slots)
    })

    await waitFor(() => {
      expect(result.current.recipeRows.length).toBe(1)
    })

    const row = result.current.recipeRows[0]
    expect(row.donutName).toBe('プレーンドーナツ')
    expect(row.recipeIndex).toBe(1)
    expect(row.berries).toBe('オレンのみ x5, モモンのみ x3')
    expect(row.totalCalories).toBe(160) // (20*5) + (20*3) = 160
    expect(row.totalLevel).toBe(8) // (1*5) + (1*3) = 8
    expect(row.sweet).toBe(50) // 10*5 = 50
    expect(row.spicy).toBe(30) // 10*3 = 30
    // Total flavor sum = 80, which is < 120, so 0 stars
    expect(row.stars).toBe(0)
    expect(row.plusLevel).toBe(8) // No boost with 0 stars
    expect(row.energyBoost).toBe(160) // No boost with 0 stars
  })

  it('should calculate stars correctly based on flavor sum', async () => {
    // Test 1 star (flavor sum = 120)
    // berries[2]: ハイフレーバーベリー with level=10, calories=100, flavors sum=120
    const mockRecipe1Star: DonutRecipe = {
      donut: {
        id: 'plain-donut',
        name: 'プレーンドーナツ',
        flavors: { sweet: 100, spicy: 0, sour: 0, bitter: 0, fresh: 0 },
      },
      stocks: [
        {
          berry: berries[2], // ハイフレーバーベリー
          count: 1,
        },
      ],
    }

    mockFindRequiredCombinations.mockReturnValue({
      recipes: [mockRecipe1Star],
      limitReached: false,
    })

    const { result } = renderHook(() => useRecipeFinder())

    await act(async () => {
      await result.current.handleFindRecipes(new Set(['plain-donut']), { 'high-flavor-berry': 10 }, 3)
    })

    await waitFor(() => {
      expect(result.current.recipeRows.length).toBe(1)
    })

    const row = result.current.recipeRows[0]
    expect(row.stars).toBe(1)
    expect(row.plusLevel).toBe(11) // 10 * 1.1 = 11
    expect(row.energyBoost).toBe(110) // 100 * 1.1 = 110
  })

  it('should clear error when clearError is called', async () => {
    const { result } = renderHook(() => useRecipeFinder())

    const selectedDonuts = new Set<string>()
    const berryStocks = { 'oran-berry': 10 }
    const slots = 3

    await act(async () => {
      try {
        await result.current.handleFindRecipes(selectedDonuts, berryStocks, slots)
      } catch {
        // Expected to throw
      }
    })

    await waitFor(() => {
      expect(result.current.error).not.toBeNull()
    })

    // Call clearError using act
    act(() => {
      result.current.clearError()
    })

    expect(result.current.error).toBeNull()
  })

  it('should clear warning when clearWarning is called', async () => {
    const mockRecipe: DonutRecipe = {
      donut: {
        id: 'plain-donut',
        name: 'プレーンドーナツ',
        flavors: { sweet: 100, spicy: 0, sour: 0, bitter: 0, fresh: 0 },
      },
      stocks: [
        {
          berry: berries[0],
          count: 5,
        },
      ],
    }

    mockFindRequiredCombinations.mockReturnValue({
      recipes: [mockRecipe],
      limitReached: true,
    })

    const { result } = renderHook(() => useRecipeFinder())

    const selectedDonuts = new Set(['plain-donut'])
    const berryStocks = { 'oran-berry': 10 }
    const slots = 3

    await act(async () => {
      await result.current.handleFindRecipes(selectedDonuts, berryStocks, slots)
    })

    await waitFor(() => {
      expect(result.current.warning).not.toBeNull()
    })

    // Call clearWarning using act
    act(() => {
      result.current.clearWarning()
    })

    expect(result.current.warning).toBeNull()
  })

  it('should set isSearching to false after search completes', async () => {
    const mockRecipe: DonutRecipe = {
      donut: {
        id: 'plain-donut',
        name: 'プレーンドーナツ',
        flavors: { sweet: 100, spicy: 0, sour: 0, bitter: 0, fresh: 0 },
      },
      stocks: [
        {
          berry: berries[0],
          count: 5,
        },
      ],
    }

    mockFindRequiredCombinations.mockReturnValue({
      recipes: [mockRecipe],
      limitReached: false,
    })

    const { result } = renderHook(() => useRecipeFinder())

    const selectedDonuts = new Set(['plain-donut'])
    const berryStocks = { 'oran-berry': 10 }
    const slots = 3

    // Initially not searching
    expect(result.current.isSearching).toBe(false)

    await act(async () => {
      await result.current.handleFindRecipes(selectedDonuts, berryStocks, slots)
    })

    // Should be done after promise resolves
    await waitFor(() => {
      expect(result.current.isSearching).toBe(false)
    })
  })
})
