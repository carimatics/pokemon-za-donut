import { findRequiredCombinations } from '@/lib/finder'
import type { BerryStock, Donut } from '@/lib/types'

export interface WorkerRequest {
  requestId: string
  donut: Donut
  stocks: BerryStock[]
  slots: number
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
  }
  error?: string
}

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const { requestId, donut, stocks, slots } = e.data

  try {
    const result = findRequiredCombinations(donut, stocks, slots)

    const response: WorkerResponse = {
      requestId,
      success: true,
      result: {
        recipes: result.recipes,
        limitReached: result.limitReached,
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
