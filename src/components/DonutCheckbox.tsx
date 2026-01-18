import { memo } from 'react'
import type { Donut } from '@/lib/types'

interface DonutCheckboxProps {
  donut: Donut
  checked: boolean
  onToggle: (donutId: string) => void
}

/**
 * Memoized donut checkbox component
 * Only re-renders when donut, checked, or onToggle changes
 */
export const DonutCheckbox = memo(function DonutCheckbox({
  donut,
  checked,
  onToggle,
}: DonutCheckboxProps) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={() => onToggle(donut.id)}
      className="w-4 h-4"
      aria-label={`${donut.name}を選択`}
    />
  )
})
