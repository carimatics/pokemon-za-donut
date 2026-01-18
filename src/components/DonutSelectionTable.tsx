import { useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table'
import { donuts } from '@/data/donuts'
import type { Donut } from '@/lib/types'
import { GuideCard } from './GuideCard'
import { DonutCheckbox } from './DonutCheckbox'
import { useIsMobile } from '@/hooks/useMediaQuery'

interface DonutSelectionTableProps {
  selectedDonuts: Set<string>
  onDonutToggle: (donutId: string) => void
  slots: number
  onSlotsChange: (slots: number) => void
}

export function DonutSelectionTable({
  selectedDonuts,
  onDonutToggle,
  slots,
  onSlotsChange,
}: DonutSelectionTableProps) {
  const isMobile = useIsMobile()

  // Donut selection table columns
  const columns = useMemo<ColumnDef<Donut>[]>(
    () => [
      {
        id: 'select',
        header: '選択',
        cell: info => {
          const donut = info.row.original
          return (
            <DonutCheckbox
              donut={donut}
              checked={selectedDonuts.has(donut.id)}
              onToggle={onDonutToggle}
            />
          )
        },
      },
      {
        accessorKey: 'name',
        header: 'ドーナツ名',
        cell: info => info.getValue(),
      },
      {
        accessorKey: 'flavors.sweet',
        header: 'スイート',
        cell: info => info.row.original.flavors.sweet,
      },
      {
        accessorKey: 'flavors.spicy',
        header: 'スパイシー',
        cell: info => info.row.original.flavors.spicy,
      },
      {
        accessorKey: 'flavors.sour',
        header: 'サワー',
        cell: info => info.row.original.flavors.sour,
      },
      {
        accessorKey: 'flavors.bitter',
        header: 'ビター',
        cell: info => info.row.original.flavors.bitter,
      },
      {
        accessorKey: 'flavors.fresh',
        header: 'フレッシュ',
        cell: info => info.row.original.flavors.fresh,
      },
    ],
    [onDonutToggle, selectedDonuts]
  )

  // Create donut table instance
  const table = useReactTable({
    data: donuts,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    // biome-ignore lint/correctness/useUniqueElementIds: single instance per route
    <section
      className="space-y-4"
      role="tabpanel"
      id="donuts-panel"
      aria-labelledby="donuts-tab"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">ドーナツ選択</h2>
        <div className="flex gap-2 items-center">
          <label className="font-medium" htmlFor="slots-input">
            利用できるきのみ数:
          </label>
          {/* biome-ignore lint/correctness/useUniqueElementIds: single instance per route */}
          <input
            id="slots-input"
            type="number"
            min="1"
            value={slots}
            onChange={(e) => onSlotsChange(Math.max(1, parseInt(e.target.value, 10) || 1))}
            className="border rounded px-3 py-1 w-24"
          />
        </div>
      </div>

      {/* User Guide for empty state */}
      {selectedDonuts.size === 0 && (
        <GuideCard
          title="使い方"
          steps={[
            '作りたいドーナツをチェックボックスで選択してください',
            '「きのみ個数入力」タブで所持しているきのみの個数を入力',
            '右下の検索ボタンをクリックしてレシピを検索',
          ]}
        />
      )}

      {/* Donut Table/Cards */}
      {isMobile ? (
        // Mobile: Card View
        <div className="space-y-3">
          {donuts.map(donut => {
            const isSelected = selectedDonuts.has(donut.id)
            return (
              <div
                key={donut.id}
                className={`border rounded-lg p-4 transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="pt-1">
                    <DonutCheckbox
                      donut={donut}
                      checked={isSelected}
                      onToggle={onDonutToggle}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-2">{donut.name}</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sweet:</span>
                        <span className="font-medium">{donut.flavors.sweet}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Spicy:</span>
                        <span className="font-medium">{donut.flavors.spicy}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sour:</span>
                        <span className="font-medium">{donut.flavors.sour}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bitter:</span>
                        <span className="font-medium">{donut.flavors.bitter}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fresh:</span>
                        <span className="font-medium">{donut.flavors.fresh}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        // Desktop: Table View
        <div className="overflow-x-auto border rounded">
          <table className="min-w-full divide-y divide-gray-200">
            <caption className="sr-only">ドーナツ選択テーブル</caption>
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {table.getRowModel().rows.map(row => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-4 py-3 text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
