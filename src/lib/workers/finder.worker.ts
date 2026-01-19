/**
 * Web Worker for parallel recipe finding
 *
 * This worker performs backtracking search on a subset of the search space.
 * Multiple workers can run in parallel to leverage multi-core CPUs.
 */

import type { BerryStock, Donut, DonutRecipe, Flavors } from '@/lib/types'

export interface WorkerTask {
  required: Donut
  stocks: BerryStock[]
  slots: number
  maxSolutions: number
  // Partition parameters - which subtree to explore
  firstBerryIndex: number
  firstBerryCount: number
}

export interface WorkerResult {
  recipes: DonutRecipe[]
  limitReached: boolean
  explored: number
}

function meetsRequirements(current: Flavors, required: Flavors): boolean {
  return (
    current.sweet >= required.sweet &&
    current.spicy >= required.spicy &&
    current.sour >= required.sour &&
    current.bitter >= required.bitter &&
    current.fresh >= required.fresh
  )
}

function canPossiblyMeet(
  current: Flavors,
  required: Flavors,
  remaining: number,
  stocks: BerryStock[],
  startIndex: number,
): boolean {
  if (remaining === 0) {
    return meetsRequirements(current, required)
  }

  // Calculate the maximum possible flavors that can be achieved
  const maxPossible: Flavors = { ...current }

  // Find the maximum flavor values from the remaining stocks
  const maxValues: Flavors = {
    sweet: 0,
    spicy: 0,
    sour: 0,
    bitter: 0,
    fresh: 0,
  }

  for (let i = startIndex; i < stocks.length; i++) {
    const stock = stocks[i]
    if (stock.count > 0) {
      const flavors = stock.berry.flavors
      maxValues.sweet = Math.max(maxValues.sweet, flavors.sweet)
      maxValues.spicy = Math.max(maxValues.spicy, flavors.spicy)
      maxValues.sour = Math.max(maxValues.sour, flavors.sour)
      maxValues.bitter = Math.max(maxValues.bitter, flavors.bitter)
      maxValues.fresh = Math.max(maxValues.fresh, flavors.fresh)
    }
  }

  maxPossible.sweet += maxValues.sweet * remaining
  maxPossible.spicy += maxValues.spicy * remaining
  maxPossible.sour += maxValues.sour * remaining
  maxPossible.bitter += maxValues.bitter * remaining
  maxPossible.fresh += maxValues.fresh * remaining

  return (
    maxPossible.sweet >= required.sweet &&
    maxPossible.spicy >= required.spicy &&
    maxPossible.sour >= required.sour &&
    maxPossible.bitter >= required.bitter &&
    maxPossible.fresh >= required.fresh
  )
}

function findRecipesPartial(task: WorkerTask): WorkerResult {
  const { required, stocks, slots, maxSolutions, firstBerryIndex, firstBerryCount } = task

  const solutions: DonutRecipe[] = []
  let limitReached = false
  let explored = 0

  function backtrack(index: number, counts: number[], remaining: number, current: Flavors) {
    explored++

    // Limit the number of solutions
    if (solutions.length >= maxSolutions) {
      limitReached = true
      return
    }

    // If current combination meets requirements, record it
    if (meetsRequirements(current, required.flavors)) {
      const recipeStocks: BerryStock[] = []
      for (let i = 0; i < stocks.length; i++) {
        if (counts[i] > 0) {
          recipeStocks.push({
            berry: stocks[i].berry,
            count: counts[i],
          })
        }
      }
      solutions.push({
        donut: required,
        stocks: recipeStocks,
      })
      return
    }

    // If no remaining slots, return
    if (remaining === 0) {
      return
    }

    // If we've considered all stocks, return
    if (index >= stocks.length) {
      return
    }

    const stock = stocks[index]
    const maxUse = Math.min(stock.count, remaining)

    // Try using the current stock from 0 up to maxUse times
    for (let use = 0; use <= maxUse; use++) {
      counts[index] = use

      // Calculate new current flavors
      const newCurrent: Flavors = {
        sweet: current.sweet + stock.berry.flavors.sweet * use,
        spicy: current.spicy + stock.berry.flavors.spicy * use,
        sour: current.sour + stock.berry.flavors.sour * use,
        bitter: current.bitter + stock.berry.flavors.bitter * use,
        fresh: current.fresh + stock.berry.flavors.fresh * use,
      }

      // Prune branches that cannot possibly meet the requirements
      if (!canPossiblyMeet(newCurrent, required.flavors, remaining - use, stocks, index + 1)) {
        counts[index] = 0
        continue
      }

      backtrack(index + 1, counts, remaining - use, newCurrent)
      counts[index] = 0
    }
  }

  // Initialize with the first berry's count (this is the partition point)
  const initialCounts = new Array(stocks.length).fill(0)
  initialCounts[firstBerryIndex] = firstBerryCount

  const firstStock = stocks[firstBerryIndex]
  const initialCurrent: Flavors = {
    sweet: firstStock.berry.flavors.sweet * firstBerryCount,
    spicy: firstStock.berry.flavors.spicy * firstBerryCount,
    sour: firstStock.berry.flavors.sour * firstBerryCount,
    bitter: firstStock.berry.flavors.bitter * firstBerryCount,
    fresh: firstStock.berry.flavors.fresh * firstBerryCount,
  }

  const remainingSlots = slots - firstBerryCount

  // Start backtracking from the next berry
  backtrack(firstBerryIndex + 1, initialCounts, remainingSlots, initialCurrent)

  return {
    recipes: solutions,
    limitReached,
    explored,
  }
}

// Worker message handler
self.onmessage = (e: MessageEvent<WorkerTask>) => {
  const task = e.data
  const result = findRecipesPartial(task)
  self.postMessage(result)
}
