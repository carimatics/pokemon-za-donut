import { memo } from 'react'
import type { Berry } from '@/lib/types'

interface BerryStockInputProps {
  berry: Berry
  value: number
  onChange: (berryId: string, count: number) => void
}

/**
 * Memoized berry stock input component
 * Only re-renders when berry, value, or onChange changes
 */
export const BerryStockInput = memo(function BerryStockInput({
  berry,
  value,
  onChange,
}: BerryStockInputProps) {
  return (
    <input
      type="number"
      min="0"
      value={value}
      onChange={(e) => onChange(berry.id, parseInt(e.target.value, 10) || 0)}
      className="border rounded px-2 py-1 w-20"
      aria-label={`${berry.name}の個数`}
    />
  )
})
