/**
 * Recipe Card View (Mobile)
 *
 * Virtualized card view for displaying recipe results on mobile screens.
 * Uses TanStack Virtual for performance with large datasets.
 */

import type { RecipeRow } from '@/lib/types'
import { useVirtualizedCards } from './hooks/useVirtualizedCards'
import { RecipeCard } from './RecipeCard'

interface RecipeCardViewProps {
  recipes: RecipeRow[]
}

export function RecipeCardView({ recipes }: RecipeCardViewProps) {
  const { virtualizer, cardContainerRef } = useVirtualizedCards(recipes)

  return (
    <div
      ref={cardContainerRef}
      className="overflow-auto border rounded"
      style={{ height: '600px' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const recipe = recipes[virtualItem.index]
          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
              className="px-3 py-1.5"
            >
              <RecipeCard recipe={recipe} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
