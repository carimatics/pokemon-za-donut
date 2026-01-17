import { useCallback } from 'react'
import { usePersistedState } from './usePersistedState'

export function useBerryStocks() {
  const [berryStocks, setBerryStocks, clearBerryStocks] = usePersistedState<Record<string, number>>(
    'pokemon-za-berry-stocks',
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
