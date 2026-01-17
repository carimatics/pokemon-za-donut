import { useState, useCallback } from 'react'

export function useDonutSelection() {
  const [selectedDonuts, setSelectedDonuts] = useState<Set<string>>(new Set())
  const [slots, setSlots] = useState<number>(8)

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
  }, [])

  return {
    selectedDonuts,
    handleDonutToggle,
    slots,
    setSlots,
  }
}
