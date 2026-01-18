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
  // Donut selection table columns
  const columns = useMemo<ColumnDef<Donut>[]>(
    () => [
      {
        id: 'select',
        header: '選択',
        cell: info => {
          const donut = info.row.original
          return (
            <input
              type="checkbox"
              checked={selectedDonuts.has(donut.id)}
              onChange={() => onDonutToggle(donut.id)}
              className="w-4 h-4"
              aria-label={`${donut.name}を選択`}
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
        header: 'Sweet',
        cell: info => info.row.original.flavors.sweet,
      },
      {
        accessorKey: 'flavors.spicy',
        header: 'Spicy',
        cell: info => info.row.original.flavors.spicy,
      },
      {
        accessorKey: 'flavors.sour',
        header: 'Sour',
        cell: info => info.row.original.flavors.sour,
      },
      {
        accessorKey: 'flavors.bitter',
        header: 'Bitter',
        cell: info => info.row.original.flavors.bitter,
      },
      {
        accessorKey: 'flavors.fresh',
        header: 'Fresh',
        cell: info => info.row.original.flavors.fresh,
      },
    ],
    [selectedDonuts, onDonutToggle]
  )

  // Create donut table instance
  const table = useReactTable({
    data: donuts,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
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

      {/* Donut Table */}
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
    </section>
  )
}
