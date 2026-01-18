import { useCallback } from 'react'
import { usePersistedState } from './usePersistedState'
import { STORAGE_KEYS } from '@/lib/constants'

export function useBerryStocks() {
  const [berryStocks, setBerryStocks, clearBerryStocks] = usePersistedState<Record<string, number>>(
    STORAGE_KEYS.BERRY_STOCKS,
    {}
  )

  const handleStockChange = useCallback((berryId: string, count: number) => {
    setBerryStocks(prev => ({
      ...prev,
      [berryId]: Math.max(0, count)
    }))
  }, [setBerryStocks])

  const handleResetStocks = useCallback(() => {
    clearBerryStocks()
  }, [clearBerryStocks])

  return {
    berryStocks,
    handleStockChange,
    handleResetStocks,
  }
}
