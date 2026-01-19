import type { RefObject } from 'react'

interface BerryStockHeaderProps {
  onResetClick: () => void
  resetButtonRef?: RefObject<HTMLButtonElement | null>
}

export function BerryStockHeader({
  onResetClick,
  resetButtonRef,
}: BerryStockHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-semibold">きのみ個数入力</h2>
      <button
        ref={resetButtonRef}
        type="button"
        onClick={onResetClick}
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
      >
        すべてリセット
      </button>
    </div>
  )
}
