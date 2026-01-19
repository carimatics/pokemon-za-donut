/**
 * Hook for creating donut order map
 * Maps donut names to their display order in the selection table
 */

import { useMemo } from 'react'
import { donuts } from '@/data/donuts'

export function useDonutOrderMap() {
  return useMemo(() => {
    const map = new Map<string, number>()
    for (const [index, donut] of donuts.entries()) {
      map.set(donut.name, index)
    }
    return map
  }, [])
}
