import { useCallback, useEffect } from 'react'
import { usePersistedState } from './usePersistedState'
import { serializeSet, deserializeSet } from '@/lib/serialization'
import { STORAGE_KEYS, DEFAULT_VALUES } from '@/lib/constants'

export function useDonutSelection(
  urlSlots?: number,
  onSlotsChange?: (slots: number) => void
) {
  const [selectedDonuts, setSelectedDonuts] = usePersistedState<Set<string>>(
    STORAGE_KEYS.SELECTED_DONUTS,
    new Set(),
    serializeSet,
    deserializeSet
  )

  const [slots, setSlots] = usePersistedState<number>(
    STORAGE_KEYS.SLOTS,
    DEFAULT_VALUES.SLOTS
  )

  // Sync URL params to localStorage when URL changes
  useEffect(() => {
    if (urlSlots !== undefined && urlSlots !== slots) {
      setSlots(urlSlots)
    }
  }, [urlSlots, slots, setSlots])

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

  // Wrapper for slots change that updates both localStorage and URL
  const handleSlotsChange = useCallback((newSlots: number) => {
    setSlots(newSlots)
    onSlotsChange?.(newSlots)
  }, [setSlots, onSlotsChange])

  return {
    selectedDonuts,
    handleDonutToggle,
    slots,
    setSlots: handleSlotsChange,
  }
}
