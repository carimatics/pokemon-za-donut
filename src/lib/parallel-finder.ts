/**
 * Parallel Recipe Finder using Web Workers
 *
 * This module provides parallel recipe finding by distributing the search space
 * across multiple Web Workers. The search space is partitioned by the first berry's
 * usage count, allowing independent parallel exploration.
 */

import type { BerryStock, Donut, DonutRecipe } from '@/lib/types'
import type { FindRecipesResult } from '@/lib/finder'
import type { WorkerTask, WorkerResult } from '@/lib/workers/finder.worker'
import FinderWorker from '@/lib/workers/finder.worker?worker'

export interface ParallelFinderOptions {
  maxWorkers?: number // Maximum number of workers to use (default: navigator.hardwareConcurrency)
  maxSolutionsPerWorker?: number // Maximum solutions per worker (default: 10000)
}

/**
 * Parallel recipe finder using Web Workers
 *
 * Distributes the backtracking search across multiple workers by partitioning
 * the search space based on the first berry's usage count.
 */
export class ParallelRecipeFinder {
  private maxWorkers: number
  private maxSolutionsPerWorker: number

  constructor(options: ParallelFinderOptions = {}) {
    this.maxWorkers = options.maxWorkers || navigator.hardwareConcurrency || 4
    this.maxSolutionsPerWorker = options.maxSolutionsPerWorker || 10000

    console.log(`[ParallelRecipeFinder] Initialized with ${this.maxWorkers} workers`)
  }

  /**
   * Find recipes in parallel using Web Workers
   *
   * @param required - Target donut with required flavors
   * @param stocks - Available berry stocks
   * @param slots - Number of berry slots
   * @returns Found recipes and whether limit was reached
   */
  async findRecipes(required: Donut, stocks: BerryStock[], slots: number): Promise<FindRecipesResult> {
    if (stocks.length === 0 || slots === 0) {
      return { recipes: [], limitReached: false }
    }

    const startTime = performance.now()

    // Generate tasks by partitioning on the first berry's usage count
    const tasks = this.generateTasks(required, stocks, slots)

    console.log(`[ParallelRecipeFinder] Generated ${tasks.length} tasks`)

    // If tasks are few, just use single-threaded approach
    if (tasks.length === 1) {
      console.log('[ParallelRecipeFinder] Single task, using one worker')
      const result = await this.runSingleWorker(tasks[0])
      const endTime = performance.now()
      console.log(
        `[ParallelRecipeFinder] Completed in ${(endTime - startTime).toFixed(2)}ms, found ${result.recipes.length} recipes`,
      )
      return result
    }

    // Run tasks in parallel with worker pool
    const results = await this.runParallel(tasks)

    // Combine results from all workers
    const allRecipes: DonutRecipe[] = []
    let limitReached = false
    let totalExplored = 0

    for (const result of results) {
      allRecipes.push(...result.recipes)
      if (result.limitReached) {
        limitReached = true
      }
      totalExplored += result.explored
    }

    const endTime = performance.now()
    console.log(
      `[ParallelRecipeFinder] Completed in ${(endTime - startTime).toFixed(2)}ms, found ${allRecipes.length} recipes`,
    )
    console.log(`[ParallelRecipeFinder] Explored ${totalExplored} nodes across ${results.length} workers`)

    return {
      recipes: allRecipes,
      limitReached,
    }
  }

  /**
   * Generate tasks by partitioning the search space
   *
   * Partitions based on the first berry's usage count (0 to min(stock.count, slots))
   */
  private generateTasks(required: Donut, stocks: BerryStock[], slots: number): WorkerTask[] {
    const tasks: WorkerTask[] = []

    // Partition on the first berry
    const firstStock = stocks[0]
    const maxUse = Math.min(firstStock.count, slots)

    // Create a task for each possible usage count of the first berry
    for (let use = 0; use <= maxUse; use++) {
      tasks.push({
        required,
        stocks,
        slots,
        maxSolutions: this.maxSolutionsPerWorker,
        firstBerryIndex: 0,
        firstBerryCount: use,
      })
    }

    return tasks
  }

  /**
   * Run a single worker task
   */
  private runSingleWorker(task: WorkerTask): Promise<WorkerResult> {
    return new Promise((resolve, reject) => {
      const worker = new FinderWorker()

      worker.onmessage = (e: MessageEvent<WorkerResult>) => {
        resolve(e.data)
        worker.terminate()
      }

      worker.onerror = (error) => {
        reject(error)
        worker.terminate()
      }

      worker.postMessage(task)
    })
  }

  /**
   * Run tasks in parallel with worker pool
   */
  private async runParallel(tasks: WorkerTask[]): Promise<WorkerResult[]> {
    const results: WorkerResult[] = []
    const workers: Worker[] = []

    // Create worker pool
    for (let i = 0; i < Math.min(this.maxWorkers, tasks.length); i++) {
      workers.push(new FinderWorker())
    }

    console.log(`[ParallelRecipeFinder] Running ${tasks.length} tasks on ${workers.length} workers`)

    // Task queue
    let nextTaskIndex = 0
    const pendingTasks = new Map<Worker, Promise<WorkerResult>>()

    // Assign task to a worker
    const assignTask = (worker: Worker): Promise<WorkerResult> | null => {
      if (nextTaskIndex >= tasks.length) {
        return null
      }

      const taskIndex = nextTaskIndex++
      const task = tasks[taskIndex]

      return new Promise((resolve, reject) => {
        const onMessage = (e: MessageEvent<WorkerResult>) => {
          resolve(e.data)
          worker.removeEventListener('message', onMessage)
          worker.removeEventListener('error', onError)
        }

        const onError = (error: ErrorEvent) => {
          reject(error)
          worker.removeEventListener('message', onMessage)
          worker.removeEventListener('error', onError)
        }

        worker.addEventListener('message', onMessage)
        worker.addEventListener('error', onError)
        worker.postMessage(task)
      })
    }

    // Initial task assignment
    for (const worker of workers) {
      const promise = assignTask(worker)
      if (promise) {
        pendingTasks.set(worker, promise)
      }
    }

    // Process tasks as they complete
    while (pendingTasks.size > 0) {
      // Wait for any worker to complete
      const completed = await Promise.race(
        Array.from(pendingTasks.entries()).map(async ([worker, promise]) => {
          const result = await promise
          return { worker, result }
        }),
      )

      results.push(completed.result)
      pendingTasks.delete(completed.worker)

      // Assign next task to the freed worker
      const nextPromise = assignTask(completed.worker)
      if (nextPromise) {
        pendingTasks.set(completed.worker, nextPromise)
      }
    }

    // Terminate all workers
    for (const worker of workers) {
      worker.terminate()
    }

    return results
  }

  /**
   * Check if parallel execution is beneficial
   *
   * For small datasets, single-threaded execution may be faster due to overhead.
   */
  static shouldUseParallel(stocks: BerryStock[], slots: number): boolean {
    // Use parallel execution if:
    // 1. Multiple berries available
    // 2. Reasonable number of slots
    return stocks.length >= 3 && slots >= 4
  }
}

/**
 * Create a parallel finder instance
 */
export function createParallelFinder(options?: ParallelFinderOptions): ParallelRecipeFinder {
  return new ParallelRecipeFinder(options)
}
