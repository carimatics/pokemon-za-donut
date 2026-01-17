import { useCallback } from 'react'
import { usePersistedState } from './usePersistedState'
import { serializeSet, deserializeSet } from '@/lib/serialization'

export function useDonutSelection(initialSlots = 8) {
  const [selectedDonuts, setSelectedDonuts] = usePersistedState<Set<string>>(
    'pokemon-za-selected-donuts',
    new Set(),
    serializeSet,
    deserializeSet
  )

  const [slots, setSlots] = usePersistedState<number>(
    'pokemon-za-slots',
    initialSlots
  )

  const handleDonutToggle = useCallback((donutId: string) => {
    setSelectedDonuts(prev => {
      const next = new Set(prev)
      if (next.has(donutId)) {
        next.delete(donutId)
      } else {
        next.add(donutId)
      }
      return next
    })
  }, [setSelectedDonuts])

  return {
    selectedDonuts,
    handleDonutToggle,
    slots,
    setSlots,
  }
}
