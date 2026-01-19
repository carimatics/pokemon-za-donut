/**
 * Hook for recipe table column definitions
 * Provides column configuration for TanStack Table
 */

import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import type { RecipeRow } from '@/lib/types'

export function useRecipeTableColumns() {
  return useMemo<ColumnDef<RecipeRow>[]>(
    () => [
      {
        accessorKey: 'donutName',
        header: 'ドーナツ',
        cell: info => info.getValue(),
        meta: { width: '150px' },
      },
      {
        accessorKey: 'recipeIndex',
        header: 'レシピ#',
        cell: info => info.getValue(),
        meta: { width: '80px' },
      },
      {
        accessorKey: 'berries',
        header: '使用きのみ',
        cell: info => <div className="text-sm whitespace-normal break-words">{info.getValue() as string}</div>,
        meta: { width: '350px' },
      },
      {
        accessorKey: 'berryCount',
        header: 'きのみ個数',
        cell: info => info.getValue(),
        meta: { width: '100px' },
      },
      {
        accessorKey: 'stars',
        header: '星',
        cell: info => {
          const stars = info.getValue() as number
          return stars > 0 ? '★'.repeat(stars) : '-'
        },
        meta: { width: '100px' },
      },
      {
        accessorKey: 'plusLevel',
        header: 'プラスレベル',
        cell: info => info.getValue(),
        meta: { width: '120px' },
      },
      {
        accessorKey: 'donutEnergy',
        header: 'ハラモチエネルギー',
        cell: info => info.getValue(),
        meta: { width: '150px' },
      },
      {
        accessorKey: 'sweet',
        header: 'スイート',
        cell: info => info.getValue(),
        meta: { width: '100px' },
      },
      {
        accessorKey: 'spicy',
        header: 'スパイシー',
        cell: info => info.getValue(),
        meta: { width: '100px' },
      },
      {
        accessorKey: 'sour',
        header: 'サワー',
        cell: info => info.getValue(),
        meta: { width: '100px' },
      },
      {
        accessorKey: 'bitter',
        header: 'ビター',
        cell: info => info.getValue(),
        meta: { width: '100px' },
      },
      {
        accessorKey: 'fresh',
        header: 'フレッシュ',
        cell: info => info.getValue(),
        meta: { width: '100px' },
      },
      {
        accessorKey: 'totalLevel',
        header: '合計レベル',
        cell: info => info.getValue(),
        meta: { width: '120px' },
      },
      {
        accessorKey: 'totalCalories',
        header: '合計カロリー',
        cell: info => info.getValue(),
        meta: { width: '120px' },
      },
    ],
    []
  )
}
