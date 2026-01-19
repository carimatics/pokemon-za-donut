import { EnhancedRecipeFinder } from '@/lib/enhanced-finder'
import type { BerryStock, Donut } from '@/lib/types'

export interface WorkerRequest {
  requestId: string
  donut: Donut
  stocks: BerryStock[]
  slots: number
  options?: {
    forceGPU?: boolean
    forceCPU?: boolean
    gpuBatchSize?: number
  }
}

export interface WorkerResponse {
  requestId: string
  success: boolean
  result?: {
    recipes: Array<{
      donut: Donut
      stocks: BerryStock[]
    }>
    limitReached: boolean
    usedGPU?: boolean
  }
  error?: string
}

// Initialize the enhanced finder once for the worker lifetime
const finder = new EnhancedRecipeFinder()
let finderInitialized = false

// Initialize GPU support when worker starts
finder.initialize().then(() => {
  finderInitialized = true
  const perfInfo = finder.isGPUAvailable()
  console.log('[Worker] Finder initialized, GPU available:', perfInfo)
}).catch((error) => {
  finderInitialized = true
  console.error('[Worker] Finder initialization warning:', error)
  // Worker will still work with CPU fallback
})

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const { requestId, donut, stocks, slots, options } = e.data

  try {
    // Wait for initialization if not ready
    if (!finderInitialized) {
      await finder.initialize()
      finderInitialized = true
    }

    // Find recipes using GPU or CPU automatically
    const result = await finder.findRecipes(donut, stocks, slots, options || {})

    const response: WorkerResponse = {
      requestId,
      success: true,
      result: {
        recipes: result.recipes,
        limitReached: result.limitReached,
        usedGPU: finder.isGPUAvailable(),
      },
    }

    self.postMessage(response)
  } catch (error) {
    const response: WorkerResponse = {
      requestId,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }

    self.postMessage(response)
  }
}
