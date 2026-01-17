import { useState, useMemo } from 'react'
import { berries } from '@/data/berries'
import type { Berry } from '@/lib/types'

export function useBerryFilter() {
  const [hyperFilter, setHyperFilter] = useState<'all' | 'true' | 'false'>('all')
  const [searchText, setSearchText] = useState('')

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
