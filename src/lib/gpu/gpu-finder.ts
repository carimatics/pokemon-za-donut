/**
 * GPU-accelerated Recipe Finder using WebGPU
 *
 * This module provides GPU-accelerated recipe finding for large datasets.
 * It uses WebGPU compute shaders to parallelize flavor calculations.
 */

import type { BerryStock, Donut, DonutRecipe, Flavors } from '@/lib/types'
import type { FindRecipesResult } from '@/lib/finder'
import { initializeGPU, cleanupGPU, type GPUDeviceInfo } from './webgpu-support'
import { flavorCalculationShader } from './shaders.wgsl'

const MAX_SLOTS = 8

interface GPUBerry {
  berryId: number
  spicy: number
  fresh: number
  sweet: number
  bitter: number
  sour: number
  count: number
  padding: number
}

interface GPURecipe {
  berryIndices: Uint32Array // Array of berry indices (8 slots)
  slotCount: number
  padding: number[]
}

interface GPUFlavorResult {
  totalSpicy: number
  totalFresh: number
  totalSweet: number
  totalBitter: number
  totalSour: number
  isValid: number
  padding: number[]
}

/**
 * GPU-accelerated recipe finder
 *
 * Uses WebGPU compute shaders to perform parallel computation
 * of recipe flavor totals and validation.
 */
export class GPURecipeFinder {
  private deviceInfo: GPUDeviceInfo | null = null
  private pipeline: GPUComputePipeline | null = null
  private bindGroupLayout: GPUBindGroupLayout | null = null

  /**
   * Initialize GPU resources
   * @throws Error if GPU initialization fails
   */
  async initialize(): Promise<void> {
    try {
      this.deviceInfo = await initializeGPU()

      // Create shader module
      const shaderModule = this.deviceInfo.device.createShaderModule({
        label: 'Recipe Finder Compute Shader',
        code: flavorCalculationShader,
      })

      // Create bind group layout
      this.bindGroupLayout = this.deviceInfo.device.createBindGroupLayout({
        label: 'Recipe Finder Bind Group Layout',
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: 'read-only-storage' },
          },
          {
            binding: 1,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: 'read-only-storage' },
          },
          {
            binding: 2,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: 'read-only-storage' },
          },
          {
            binding: 3,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: 'storage' },
          },
        ],
      })

      // Create pipeline layout
      const pipelineLayout = this.deviceInfo.device.createPipelineLayout({
        label: 'Recipe Finder Pipeline Layout',
        bindGroupLayouts: [this.bindGroupLayout],
      })

      // Create compute pipeline
      this.pipeline = this.deviceInfo.device.createComputePipeline({
        label: 'Recipe Finder Compute Pipeline',
        layout: pipelineLayout,
        compute: {
          module: shaderModule,
          entryPoint: 'main',
        },
      })

      console.log('[GPURecipeFinder] Initialized successfully')
    } catch (error) {
      console.error('[GPURecipeFinder] Initialization failed:', error)
      throw error
    }
  }

  /**
   * Find recipes using GPU acceleration
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
    if (!this.deviceInfo || !this.pipeline || !this.bindGroupLayout) {
      throw new Error('GPU not initialized. Call initialize() first.')
    }

    // Generate candidate recipes (this is still CPU-based for now)
    // In a full implementation, we would generate combinations more intelligently
    const candidates = this.generateCandidateRecipes(stocks, slots, batchSize)

    if (candidates.length === 0) {
      return { recipes: [], limitReached: false }
    }

    // Convert data to GPU format
    const gpuBerries = this.stocksToGPUBerries(stocks)
    const gpuRecipes = this.candidatesToGPURecipes(candidates, stocks)

    // Create GPU buffers
    const berriesBuffer = this.createBerriesBuffer(gpuBerries)
    const recipesBuffer = this.createRecipesBuffer(gpuRecipes)
    const requiredBuffer = this.createRequiredBuffer(required.flavors)
    const resultsBuffer = this.createResultsBuffer(gpuRecipes.length)

    try {
      // Create bind group
      const bindGroup = this.deviceInfo.device.createBindGroup({
        label: 'Recipe Finder Bind Group',
        layout: this.bindGroupLayout,
        entries: [
          { binding: 0, resource: { buffer: berriesBuffer } },
          { binding: 1, resource: { buffer: recipesBuffer } },
          { binding: 2, resource: { buffer: requiredBuffer } },
          { binding: 3, resource: { buffer: resultsBuffer } },
        ],
      })

      // Create command encoder
      const commandEncoder = this.deviceInfo.device.createCommandEncoder({
        label: 'Recipe Finder Command Encoder',
      })

      // Compute pass
      const computePass = commandEncoder.beginComputePass({
        label: 'Recipe Finder Compute Pass',
      })
      computePass.setPipeline(this.pipeline)
      computePass.setBindGroup(0, bindGroup)

      // Dispatch workgroups (64 threads per workgroup)
      const workgroupCount = Math.ceil(gpuRecipes.length / 64)
      computePass.dispatchWorkgroups(workgroupCount)
      computePass.end()

      // Submit commands
      this.deviceInfo.device.queue.submit([commandEncoder.finish()])

      // Read results back from GPU
      const results = await this.readResults(resultsBuffer, gpuRecipes.length)

      // Convert valid results back to DonutRecipe format
      const recipes = this.convertResults(results, candidates, required, stocks)

      console.log(
        `[GPURecipeFinder] Processed ${gpuRecipes.length} candidates, found ${recipes.length} valid recipes`,
      )

      return {
        recipes,
        limitReached: recipes.length >= batchSize,
      }
    } finally {
      // Clean up buffers
      berriesBuffer.destroy()
      recipesBuffer.destroy()
      requiredBuffer.destroy()
      resultsBuffer.destroy()
    }
  }

  /**
   * Clean up GPU resources
   */
  destroy(): void {
    if (this.deviceInfo) {
      cleanupGPU(this.deviceInfo)
      this.deviceInfo = null
      this.pipeline = null
      this.bindGroupLayout = null
      console.log('[GPURecipeFinder] Resources cleaned up')
    }
  }

  /**
   * Generate candidate recipes for GPU processing
   *
   * This generates all possible berry combinations up to the specified slot count.
   * GPU will validate which combinations meet the required flavors.
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
      // GPU will validate if it meets requirements
      if (current.length > 0 && current.length <= slots) {
        candidates.push([...current])
      }

      // If no remaining slots, stop recursion
      if (remaining === 0) {
        return
      }

      // Try adding each berry type
      for (let i = startIndex; i < stocks.length && candidates.length < maxCandidates; i++) {
        const maxUse = Math.min(stocks[i].count, remaining)

        // Try using this berry 1 to maxUse times
        for (let use = 1; use <= maxUse && candidates.length < maxCandidates; use++) {
          // Add 'use' copies of berry i to current combination
          for (let j = 0; j < use; j++) {
            current.push(i)
          }

          // Recurse with remaining slots
          generateCombinations(current, remaining - use, i + 1)

          // Backtrack: remove the berries we just added
          for (let j = 0; j < use; j++) {
            current.pop()
          }
        }
      }
    }

    generateCombinations([], slots, 0)

    console.log(`[GPURecipeFinder] Generated ${candidates.length} candidate combinations`)
    return candidates
  }

  /**
   * Convert berry stocks to GPU format
   */
  private stocksToGPUBerries(stocks: BerryStock[]): GPUBerry[] {
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
   * Convert candidate recipes to GPU format
   */
  private candidatesToGPURecipes(candidates: number[][], _stocks: BerryStock[]): GPURecipe[] {
    return candidates.map((candidate) => {
      const indices = new Uint32Array(MAX_SLOTS)
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
   * Create GPU buffer for berries
   */
  private createBerriesBuffer(berries: GPUBerry[]): GPUBuffer {
    if (!this.deviceInfo) throw new Error('GPU not initialized')

    // Each berry: 8 floats/u32s = 32 bytes
    const bufferSize = berries.length * 32
    const buffer = this.deviceInfo.device.createBuffer({
      label: 'Berries Buffer',
      size: bufferSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    })

    // Pack berry data
    const data = new Float32Array(berries.length * 8)
    for (let i = 0; i < berries.length; i++) {
      const offset = i * 8
      const berry = berries[i]
      data[offset + 0] = berry.berryId
      data[offset + 1] = berry.spicy
      data[offset + 2] = berry.fresh
      data[offset + 3] = berry.sweet
      data[offset + 4] = berry.bitter
      data[offset + 5] = berry.sour
      data[offset + 6] = berry.count
      data[offset + 7] = berry.padding
    }

    this.deviceInfo.device.queue.writeBuffer(buffer, 0, data)
    return buffer
  }

  /**
   * Create GPU buffer for recipes
   */
  private createRecipesBuffer(recipes: GPURecipe[]): GPUBuffer {
    if (!this.deviceInfo) throw new Error('GPU not initialized')

    // Each recipe: 8 u32s (indices) + 1 u32 (slotCount) + 3 u32s (padding) = 48 bytes
    const bufferSize = recipes.length * 48
    const buffer = this.deviceInfo.device.createBuffer({
      label: 'Recipes Buffer',
      size: bufferSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    })

    // Pack recipe data
    const data = new Uint32Array(recipes.length * 12)
    for (let i = 0; i < recipes.length; i++) {
      const offset = i * 12
      const recipe = recipes[i]
      for (let j = 0; j < MAX_SLOTS; j++) {
        data[offset + j] = recipe.berryIndices[j]
      }
      data[offset + 8] = recipe.slotCount
      data[offset + 9] = 0 // padding
      data[offset + 10] = 0 // padding
      data[offset + 11] = 0 // padding
    }

    this.deviceInfo.device.queue.writeBuffer(buffer, 0, data)
    return buffer
  }

  /**
   * Create GPU buffer for required flavors
   */
  private createRequiredBuffer(flavors: Flavors): GPUBuffer {
    if (!this.deviceInfo) throw new Error('GPU not initialized')

    // 5 floats (flavors) + 3 u32s (padding) = 32 bytes
    const buffer = this.deviceInfo.device.createBuffer({
      label: 'Required Flavors Buffer',
      size: 32,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    })

    const data = new Float32Array(8)
    data[0] = flavors.spicy
    data[1] = flavors.fresh
    data[2] = flavors.sweet
    data[3] = flavors.bitter
    data[4] = flavors.sour
    data[5] = 0 // padding
    data[6] = 0 // padding
    data[7] = 0 // padding

    this.deviceInfo.device.queue.writeBuffer(buffer, 0, data)
    return buffer
  }

  /**
   * Create GPU buffer for results
   */
  private createResultsBuffer(count: number): GPUBuffer {
    if (!this.deviceInfo) throw new Error('GPU not initialized')

    // Each result: 5 floats (totals) + 1 u32 (isValid) + 2 u32s (padding) = 32 bytes
    const bufferSize = count * 32
    return this.deviceInfo.device.createBuffer({
      label: 'Results Buffer',
      size: bufferSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    })
  }

  /**
   * Read results from GPU buffer
   */
  private async readResults(buffer: GPUBuffer, count: number): Promise<GPUFlavorResult[]> {
    if (!this.deviceInfo) throw new Error('GPU not initialized')

    // Create staging buffer for readback
    const stagingBuffer = this.deviceInfo.device.createBuffer({
      label: 'Results Staging Buffer',
      size: buffer.size,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    })

    // Copy data to staging buffer
    const commandEncoder = this.deviceInfo.device.createCommandEncoder()
    commandEncoder.copyBufferToBuffer(buffer, 0, stagingBuffer, 0, buffer.size)
    this.deviceInfo.device.queue.submit([commandEncoder.finish()])

    // Map and read data
    await stagingBuffer.mapAsync(GPUMapMode.READ)
    const arrayBuffer = stagingBuffer.getMappedRange()
    const data = new Float32Array(arrayBuffer.slice(0))
    stagingBuffer.unmap()
    stagingBuffer.destroy()

    // Parse results
    const results: GPUFlavorResult[] = []
    for (let i = 0; i < count; i++) {
      const offset = i * 8
      results.push({
        totalSpicy: data[offset + 0],
        totalFresh: data[offset + 1],
        totalSweet: data[offset + 2],
        totalBitter: data[offset + 3],
        totalSour: data[offset + 4],
        isValid: data[offset + 5],
        padding: [data[offset + 6], data[offset + 7]],
      })
    }

    return results
  }

  /**
   * Convert GPU results to DonutRecipe format
   */
  private convertResults(
    results: GPUFlavorResult[],
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
