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

/**
 * Normalize text for search: convert katakana to hiragana and lowercase
 * This allows matching regardless of hiragana/katakana differences
 */
function normalizeForSearch(str: string): string {
  // Convert katakana to hiragana
  const hiragana = str.replace(/[\u30A1-\u30F6]/g, match => {
    const code = match.charCodeAt(0) - 0x60
    return String.fromCharCode(code)
  })
  return hiragana.toLowerCase()
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
        const normalizedSearch = normalizeForSearch(debouncedSearchText)
        const normalizedName = normalizeForSearch(berry.name)
        const normalizedId = berry.id.toLowerCase()

        return normalizedName.includes(normalizedSearch) ||
               normalizedId.includes(normalizedSearch)
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
