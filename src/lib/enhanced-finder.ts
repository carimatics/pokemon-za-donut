/**
 * Enhanced Recipe Finder with GPU Acceleration Support
 *
 * This module provides a unified interface for recipe finding that automatically
 * chooses between GPU and CPU implementations based on:
 * 1. GPU availability
 * 2. Dataset size
 * 3. Performance characteristics
 *
 * It gracefully falls back to CPU when GPU is unavailable or encounters errors.
 */

import type { BerryStock, Donut } from '@/lib/types'
import { findRequiredCombinations, type FindRecipesResult } from '@/lib/finder'
import { isTypeGPUSupported } from '@/lib/gpu/tgpu-context'
import { TypeGPURecipeFinder } from '@/lib/gpu/tgpu-finder'

// Thresholds for GPU acceleration
const GPU_MIN_BERRY_COUNT = 15 // Minimum number of berries to use GPU
const GPU_MIN_SLOTS = 4 // Minimum number of slots to use GPU

export interface FinderOptions {
  forceGPU?: boolean // Force GPU usage even if below thresholds
  forceCPU?: boolean // Force CPU usage even if GPU is available
  gpuBatchSize?: number // Batch size for GPU processing (default: 10000)
}

/**
 * Enhanced recipe finder with automatic GPU/CPU selection
 *
 * This class provides a high-level interface that automatically selects
 * the best implementation (GPU or CPU) based on the current environment
 * and dataset characteristics.
 *
 * Uses TypeGPU for type-safe GPU acceleration.
 */
export class EnhancedRecipeFinder {
  private gpuFinder: TypeGPURecipeFinder | null = null
  private gpuAvailable = false
  private gpuInitialized = false
  private initializationError: Error | null = null

  /**
   * Initialize the finder and detect GPU support
   *
   * This method is optional - if not called, initialization will happen
   * automatically on first use. However, calling it explicitly allows
   * you to handle initialization errors upfront.
   */
  async initialize(): Promise<void> {
    if (this.gpuInitialized) {
      return
    }

    try {
      // Check TypeGPU support
      const typeGPUSupported = await isTypeGPUSupported()

      // Initialize TypeGPU if supported
      if (typeGPUSupported) {
        this.gpuFinder = new TypeGPURecipeFinder()
        await this.gpuFinder.initialize()
        this.gpuAvailable = true
        console.log('[EnhancedRecipeFinder] TypeGPU acceleration enabled')
      } else {
        console.log('[EnhancedRecipeFinder] TypeGPU not available, using CPU only')
        this.gpuAvailable = false
      }

      this.gpuInitialized = true
    } catch (error) {
      console.error('[EnhancedRecipeFinder] GPU initialization failed:', error)
      this.initializationError = error as Error
      this.gpuAvailable = false
      this.gpuFinder = null
      this.gpuInitialized = true
    }
  }

  /**
   * Find recipes using the best available method (GPU or CPU)
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
    // Initialize if not already done
    if (!this.gpuInitialized) {
      await this.initialize()
    }

    // Determine whether to use GPU
    const shouldUseGPU = this.shouldUseGPU(stocks, slots, options)

    if (shouldUseGPU && this.gpuFinder) {
      try {
        console.log('[EnhancedRecipeFinder] Using GPU acceleration (TypeGPU)')
        const startTime = performance.now()

        const result = await this.gpuFinder.findRecipes(
          required,
          stocks,
          slots,
          options.gpuBatchSize || 10000,
        )

        const endTime = performance.now()
        console.log(`[EnhancedRecipeFinder] GPU processing took ${(endTime - startTime).toFixed(2)}ms`)

        return result
      } catch (error) {
        console.error('[EnhancedRecipeFinder] GPU processing failed, falling back to CPU:', error)
        // Fall through to CPU implementation
      }
    }

    // Use CPU implementation
    console.log('[EnhancedRecipeFinder] Using CPU processing')
    const startTime = performance.now()

    const result = findRequiredCombinations(required, stocks, slots)

    const endTime = performance.now()
    console.log(`[EnhancedRecipeFinder] CPU processing took ${(endTime - startTime).toFixed(2)}ms`)

    return result
  }

  /**
   * Determine whether GPU acceleration should be used
   *
   * This method considers:
   * - User preferences (forceGPU/forceCPU)
   * - GPU availability
   * - Dataset size (larger datasets benefit more from GPU)
   */
  private shouldUseGPU(stocks: BerryStock[], slots: number, options: FinderOptions): boolean {
    // Forced CPU mode
    if (options.forceCPU) {
      return false
    }

    // GPU not available or not initialized
    if (!this.gpuAvailable || !this.gpuFinder) {
      return false
    }

    // Forced GPU mode
    if (options.forceGPU) {
      return true
    }

    // Check if dataset is large enough to benefit from GPU
    const hasEnoughBerries = stocks.length >= GPU_MIN_BERRY_COUNT
    const hasEnoughSlots = slots >= GPU_MIN_SLOTS

    return hasEnoughBerries && hasEnoughSlots
  }

  /**
   * Check if GPU acceleration is available
   */
  isGPUAvailable(): boolean {
    return this.gpuAvailable && this.gpuFinder !== null
  }

  /**
   * Get GPU initialization error if any
   */
  getInitializationError(): Error | null {
    return this.initializationError
  }

  /**
   * Get performance characteristics for the current environment
   */
  async getPerformanceInfo(): Promise<{
    gpuAvailable: boolean
    gpuInitialized: boolean
    cpuAvailable: boolean
    error: string | null
  }> {
    if (!this.gpuInitialized) {
      await this.initialize()
    }

    return {
      gpuAvailable: this.gpuAvailable,
      gpuInitialized: this.gpuInitialized,
      cpuAvailable: true,
      error: this.initializationError?.message || null,
    }
  }

  /**
   * Clean up GPU resources
   *
   * Call this when you're done using the finder to release GPU resources.
   */
  destroy(): void {
    if (this.gpuFinder) {
      this.gpuFinder.destroy()
      this.gpuFinder = null
      console.log('[EnhancedRecipeFinder] GPU resources cleaned up')
    }
    this.gpuAvailable = false
    this.gpuInitialized = false
    this.initializationError = null
  }
}

/**
 * Create a new EnhancedRecipeFinder instance
 *
 * This is a convenience function for creating and optionally initializing
 * an EnhancedRecipeFinder instance.
 *
 * @param autoInitialize - If true, initialize GPU support immediately (default: true)
 * @returns A new EnhancedRecipeFinder instance
 */
export async function createEnhancedFinder(autoInitialize = true): Promise<EnhancedRecipeFinder> {
  const finder = new EnhancedRecipeFinder()

  if (autoInitialize) {
    await finder.initialize()
  }

  return finder
}
