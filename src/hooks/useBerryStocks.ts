import { useState, useCallback } from 'react'

export function useBerryStocks() {
  const [berryStocks, setBerryStocks] = useState<Record<string, number>>({})

  const handleStockChange = useCallback((berryId: string, count: number) => {
    setBerryStocks(prev => ({
      ...prev,
      [berryId]: Math.max(0, count)
    }))
  }, [])

  const handleResetStocks = useCallback(() => {
    setBerryStocks({})
  }, [])

  return {
    berryStocks,
    handleStockChange,
    handleResetStocks,
  }
}
