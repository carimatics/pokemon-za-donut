/**
 * Enhanced Recipe Finder with Parallel Processing Support
 *
 * This module provides a unified interface for recipe finding that automatically
 * chooses between parallel (Web Workers) and single-threaded implementations based on:
 * 1. Dataset size
 * 2. Available CPU cores
 * 3. Browser support for Web Workers
 *
 * It gracefully falls back to single-threaded CPU when parallel execution is not beneficial.
 */

import type { BerryStock, Donut } from '@/lib/types'
import { findRequiredCombinations, type FindRecipesResult } from '@/lib/finder'
import { ParallelRecipeFinder } from '@/lib/parallel-finder'

// Thresholds for parallel execution
const PARALLEL_MIN_BERRY_COUNT = 3 // Minimum number of berries to use parallel
const PARALLEL_MIN_SLOTS = 4 // Minimum number of slots to use parallel

export interface FinderOptions {
  forceParallel?: boolean // Force parallel execution even if below thresholds
  forceSingleThread?: boolean // Force single-threaded execution even if parallel is available
  maxWorkers?: number // Maximum number of workers (default: navigator.hardwareConcurrency)
}

/**
 * Enhanced recipe finder with automatic parallel/single-threaded selection
 *
 * This class provides a high-level interface that automatically selects
 * the best implementation (parallel or single-threaded) based on the current
 * environment and dataset characteristics.
 */
export class EnhancedRecipeFinder {
  private parallelFinder: ParallelRecipeFinder

  constructor() {
    this.parallelFinder = new ParallelRecipeFinder()
  }

  /**
   * Find recipes using the best available method (parallel or single-threaded)
   *
   * @param required - Target donut with required flavors
   * @param stocks - Available berry stocks
   * @param slots - Number of berry slots
   * @param options - Optional configuration for finder behavior
   * @returns Found recipes and whether limit was reached
   */
  async findRecipes(
    required: Donut,
    stocks: BerryStock[],
    slots: number,
    options: FinderOptions = {},
  ): Promise<FindRecipesResult> {
    // Determine whether to use parallel execution
    const shouldUseParallel = this.shouldUseParallel(stocks, slots, options)

    if (shouldUseParallel) {
      try {
        console.log('[EnhancedRecipeFinder] Using parallel execution with Web Workers')
        const startTime = performance.now()

        const parallelResult = await this.parallelFinder.findRecipes(required, stocks, slots)

        const endTime = performance.now()
        console.log(`[EnhancedRecipeFinder] Parallel processing took ${(endTime - startTime).toFixed(2)}ms`)
        console.log(`[EnhancedRecipeFinder] Found ${parallelResult.recipes.length} recipes`)

        return parallelResult
      } catch (error) {
        console.error('[EnhancedRecipeFinder] Parallel processing failed, falling back to single-threaded:', error)
        // Fall through to single-threaded implementation
      }
    }

    // Use single-threaded CPU implementation
    console.log('[EnhancedRecipeFinder] Using single-threaded CPU processing')
    const startTime = performance.now()

    const result = findRequiredCombinations(required, stocks, slots)

    const endTime = performance.now()
    console.log(`[EnhancedRecipeFinder] CPU processing took ${(endTime - startTime).toFixed(2)}ms`)
    console.log(`[EnhancedRecipeFinder] CPU found ${result.recipes.length} recipes`)

    return result
  }

  /**
   * Determine whether parallel execution should be used
   *
   * This method considers:
   * - User preferences (forceParallel/forceSingleThread)
   * - Web Worker availability
   * - Dataset size (larger datasets benefit more from parallel execution)
   */
  private shouldUseParallel(stocks: BerryStock[], slots: number, options: FinderOptions): boolean {
    // Forced single-threaded mode
    if (options.forceSingleThread) {
      return false
    }

    // Check if Web Workers are available
    if (typeof Worker === 'undefined') {
      console.log('[EnhancedRecipeFinder] Web Workers not available')
      return false
    }

    // Forced parallel mode
    if (options.forceParallel) {
      return true
    }

    // Check if dataset is large enough to benefit from parallel execution
    const hasEnoughBerries = stocks.length >= PARALLEL_MIN_BERRY_COUNT
    const hasEnoughSlots = slots >= PARALLEL_MIN_SLOTS

    return hasEnoughBerries && hasEnoughSlots
  }

  /**
   * Check if parallel execution is available
   */
  isParallelAvailable(): boolean {
    return typeof Worker !== 'undefined'
  }

  /**
   * Get performance characteristics for the current environment
   */
  getPerformanceInfo(): {
    parallelAvailable: boolean
    workerCount: number
    cpuAvailable: boolean
  } {
    return {
      parallelAvailable: this.isParallelAvailable(),
      workerCount: navigator.hardwareConcurrency || 4,
      cpuAvailable: true,
    }
  }
}

/**
 * Create a new EnhancedRecipeFinder instance
 *
 * @returns A new EnhancedRecipeFinder instance
 */
export function createEnhancedFinder(): EnhancedRecipeFinder {
  return new EnhancedRecipeFinder()
}
