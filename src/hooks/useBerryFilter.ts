import { useMemo } from 'react'
import { berries } from '@/data/berries'
import type { Berry } from '@/lib/types'
import { useDebouncedValue } from './useDebouncedValue'
import { DEFAULT_VALUES } from '@/lib/constants'

interface UseBerryFilterProps {
  hyperFilter: 'all' | 'true' | 'false'
  searchText: string
  setHyperFilter: (filter: 'all' | 'true' | 'false') => void
  setSearchText: (text: string) => void
}

export function useBerryFilter({
  hyperFilter,
  searchText,
  setHyperFilter,
  setSearchText,
}: UseBerryFilterProps) {
  // Debounce search text to avoid filtering on every keystroke
  const debouncedSearchText = useDebouncedValue(searchText, DEFAULT_VALUES.DEBOUNCE_DELAY)

  const filteredBerries = useMemo<Berry[]>(() => {
    return berries.filter(berry => {
      // Hyper filter
      if (hyperFilter !== 'all' && berry.hyper !== (hyperFilter === 'true')) {
        return false
      }

      // Search filter with debounced value
      if (debouncedSearchText) {
        const search = debouncedSearchText.toLowerCase()
        return berry.name.toLowerCase().includes(search) ||
               berry.id.toLowerCase().includes(search)
      }

      return true
    })
  }, [hyperFilter, debouncedSearchText])

  return {
    filteredBerries,
    hyperFilter,
    setHyperFilter,
    searchText,
    setSearchText,
  }
}
