import type { BerryStock, Donut, DonutRecipe, Flavors } from '@/lib/types.ts';
import { DEFAULT_VALUES } from '@/lib/constants';

export type FindRecipesResult = {
  recipes: DonutRecipe[]
  limitReached: boolean
}

export function findRequiredCombinations(
  required: Donut,
  stocks: BerryStock[],
  slots: number,
): FindRecipesResult {
  const solutions: DonutRecipe[] = [];
  let limitReached = false;

  function backtrack(index: number, counts: number[], remaining: number, current: Flavors) {
    // Limit the number of solutions to avoid excessive computation
    if (solutions.length >= DEFAULT_VALUES.MAX_SOLUTIONS) {
      limitReached = true;
      return;
    }

    // Check if current flavors meet requirements
    if (meetsRequirements(current, required.flavors)) {
      const recipeStocks: BerryStock[] = [];
      for (let i = 0; i < stocks.length; i++) {
        if (counts[i] > 0) {
          recipeStocks.push({
            berry: stocks[i].berry,
            count: counts[i],
          });
        }
      }
      solutions.push({
        donut: required,
        stocks: recipeStocks,
      });
    }

    // If no remaining slots, return
    if (remaining === 0) {
      return;
    }

    // If we've considered all stocks, return
    if (index >= stocks.length) {
      return;
    }

    const stock = stocks[index];
    const maxUse = Math.min(stock.count, remaining);

    // Try using the current stock from 0 up to maxUse times
    for (let use = 0; use <= maxUse; use++) {
      counts[index] = use;

      // Calculate new current flavors
      const newCurrent: Flavors = {
        sweet: current.sweet + stock.berry.flavors.sweet * use,
        spicy: current.spicy + stock.berry.flavors.spicy * use,
        sour: current.sour + stock.berry.flavors.sour * use,
        bitter: current.bitter + stock.berry.flavors.bitter * use,
        fresh: current.fresh + stock.berry.flavors.fresh * use,
      };

      // Prune branches that cannot possibly meet the requirements
      if (!canPossiblyMeet(newCurrent, required.flavors, remaining - use, stocks, index + 1)) {
        counts[index] = 0;
        continue;
      }

      backtrack(index + 1, counts, remaining - use, newCurrent);
      counts[index] = 0;
    }
  }

  const initialCounts = new Array(stocks.length).fill(0);
  const initialCurrent: Flavors = {
    sweet: 0,
    spicy: 0,
    sour: 0,
    bitter: 0,
    fresh: 0,
  };

  backtrack(0, initialCounts, slots, initialCurrent);
  return {
    recipes: solutions,
    limitReached,
  };
}

function meetsRequirements(current: Flavors, required: Flavors): boolean {
  return current.sweet >= required.sweet &&
    current.spicy >= required.spicy &&
    current.sour >= required.sour &&
    current.bitter >= required.bitter &&
    current.fresh >= required.fresh;
}

function canPossiblyMeet(
  current: Flavors,
  required: Flavors,
  remaining: number,
  stocks: BerryStock[],
  startIndex: number,
): boolean {
  if (remaining === 0) {
    return meetsRequirements(current, required);
  }

  // Calculate the maximum possible flavors that can be achieved
  const maxPossible: Flavors = {
    ...current,
  };

  // Find the maximum flavor values from the remaining stocks
  const maxValues: Flavors = {
    sweet: 0,
    spicy: 0,
    sour: 0,
    bitter: 0,
    fresh: 0,
  };

  for (let i = startIndex; i < stocks.length; i++) {
    const stock = stocks[i];
    if (stock.count > 0) {
      const flavors = stock.berry.flavors;
      maxValues.sweet = Math.max(maxValues.sweet, flavors.sweet);
      maxValues.spicy = Math.max(maxValues.spicy, flavors.spicy);
      maxValues.sour = Math.max(maxValues.sour, flavors.sour);
      maxValues.bitter = Math.max(maxValues.bitter, flavors.bitter);
      maxValues.fresh = Math.max(maxValues.fresh, flavors.fresh);
    }
  }

  maxPossible.sweet += maxValues.sweet * remaining;
  maxPossible.spicy += maxValues.spicy * remaining;
  maxPossible.sour += maxValues.sour * remaining;
  maxPossible.bitter += maxValues.bitter * remaining;
  maxPossible.fresh += maxValues.fresh * remaining;

  // Check if the maximum possible flavors can meet the requirements
  return maxPossible.sweet >= required.sweet &&
    maxPossible.spicy >= required.spicy &&
    maxPossible.sour >= required.sour &&
    maxPossible.bitter >= required.bitter &&
    maxPossible.fresh >= required.fresh;
}
