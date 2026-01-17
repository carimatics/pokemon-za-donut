import { useMemo } from 'react'
import { berries } from '@/data/berries'
import type { Berry } from '@/lib/types'

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
  const filteredBerries = useMemo<Berry[]>(() => {
    return berries.filter(berry => {
      // Hyper filter
      if (hyperFilter !== 'all' && berry.hyper !== (hyperFilter === 'true')) {
        return false
      }

      // Search filter
      if (searchText) {
        const search = searchText.toLowerCase()
        return berry.name.toLowerCase().includes(search) ||
               berry.id.toLowerCase().includes(search)
      }

      return true
    })
  }, [hyperFilter, searchText])

  return {
    filteredBerries,
    hyperFilter,
    setHyperFilter,
    searchText,
    setSearchText,
  }
}
