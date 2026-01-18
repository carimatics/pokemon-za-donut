import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { userEvent } from '@testing-library/user-event'
import { BerryStockTable } from '../BerryStockTable'
import type { Berry } from '@/lib/types'

// Mock useMediaQuery hook
vi.mock('@/hooks/useMediaQuery', () => ({
  useIsMobile: vi.fn(() => false), // Default to desktop
}))

import { useIsMobile } from '@/hooks/useMediaQuery'

const mockUseIsMobile = useIsMobile as ReturnType<typeof vi.fn>

const mockBerries: Berry[] = [
  {
    id: 'oran-berry',
    name: 'オレンのみ',
    level: 1,
    calories: 20,
    flavors: { sweet: 10, spicy: 0, sour: 0, bitter: 0, fresh: 0 },
    hyper: false,
  },
  {
    id: 'pecha-berry',
    name: 'モモンのみ',
    level: 1,
    calories: 20,
    flavors: { sweet: 0, spicy: 10, sour: 0, bitter: 0, fresh: 0 },
    hyper: false,
  },
  {
    id: 'hyper-berry',
    name: '異次元きのみ',
    level: 2,
    calories: 30,
    flavors: { sweet: 15, spicy: 15, sour: 0, bitter: 0, fresh: 0 },
    hyper: true,
  },
]

describe('BerryStockTable', () => {
  const mockOnStockChange = vi.fn()
  const mockOnResetStocks = vi.fn()
  const mockOnHyperFilterChange = vi.fn()
  const mockOnSearchTextChange = vi.fn()

  const defaultProps = {
    filteredBerries: mockBerries,
    berryStocks: { 'oran-berry': 5, 'pecha-berry': 3 },
    onStockChange: mockOnStockChange,
    onResetStocks: mockOnResetStocks,
    hyperFilter: 'all' as const,
    onHyperFilterChange: mockOnHyperFilterChange,
    searchText: '',
    onSearchTextChange: mockOnSearchTextChange,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseIsMobile.mockReturnValue(false) // Default to desktop
  })

  it('should render berry stock table with all berries', () => {
    render(<BerryStockTable {...defaultProps} />)

    expect(screen.getByText('きのみ個数入力')).toBeInTheDocument()
    expect(screen.getByText('オレンのみ')).toBeInTheDocument()
    expect(screen.getByText('モモンのみ')).toBeInTheDocument()
    expect(screen.getByText('異次元きのみ')).toBeInTheDocument()
  })

  it('should display berry stock values', () => {
    render(<BerryStockTable {...defaultProps} />)

    const oranInput = screen.getAllByDisplayValue('5')[0]
    const pechaInput = screen.getAllByDisplayValue('3')[0]

    expect(oranInput).toBeInTheDocument()
    expect(pechaInput).toBeInTheDocument()
  })

  it('should call onStockChange when berry count is changed', async () => {
    const user = userEvent.setup()

    render(<BerryStockTable {...defaultProps} />)

    const inputs = screen.getAllByRole('spinbutton')
    const oranInput = inputs[0]

    await user.clear(oranInput)
    await user.type(oranInput, '8')

    // Verify onStockChange was called with oran-berry
    expect(mockOnStockChange).toHaveBeenCalled()
    // Check that oran-berry was in the calls
    const calls = mockOnStockChange.mock.calls
    expect(calls.some(call => call[0] === 'oran-berry')).toBe(true)
  })

  it('should call onResetStocks when reset button is clicked', async () => {
    const user = userEvent.setup()

    render(<BerryStockTable {...defaultProps} />)

    const resetButton = screen.getByText('すべてリセット')
    await user.click(resetButton)

    expect(mockOnResetStocks).toHaveBeenCalled()
  })

  it('should call onHyperFilterChange when filter changes', async () => {
    const user = userEvent.setup()

    render(<BerryStockTable {...defaultProps} />)

    const filterSelect = screen.getByLabelText('きのみ種別:')
    await user.selectOptions(filterSelect, 'true')

    expect(mockOnHyperFilterChange).toHaveBeenCalledWith('true')
  })

  it('should call onSearchTextChange when search text changes', async () => {
    const user = userEvent.setup()

    render(<BerryStockTable {...defaultProps} />)

    const searchInput = screen.getByLabelText('Search:')
    await user.type(searchInput, 'オレン')

    expect(mockOnSearchTextChange).toHaveBeenCalled()
  })

  it('should render all filter options', () => {
    render(<BerryStockTable {...defaultProps} />)

    const filterSelect = screen.getByLabelText('きのみ種別:')
    expect(filterSelect).toContainHTML('<option value="all">すべて</option>')
    expect(filterSelect).toContainHTML('<option value="true">異次元のみ</option>')
    expect(filterSelect).toContainHTML('<option value="false">通常のみ</option>')
  })

  it('should display hyper berries with checkmark', () => {
    render(<BerryStockTable {...defaultProps} />)

    // Find all cells and check for checkmark
    const cells = screen.getAllByRole('cell')
    const hyperCell = cells.find(cell => cell.textContent === '✔︎')
    expect(hyperCell).toBeInTheDocument()
  })

  it('should render CSV import/export section', () => {
    render(<BerryStockTable {...defaultProps} />)

    expect(screen.getByText('CSV形式でインポート/エクスポート')).toBeInTheDocument()
    expect(screen.getByText('エクスポート')).toBeInTheDocument()
    expect(screen.getByText('インポート')).toBeInTheDocument()
  })

  it('should export CSV when export button is clicked', async () => {
    const user = userEvent.setup()

    render(<BerryStockTable {...defaultProps} />)

    const exportButton = screen.getByText('エクスポート')
    await user.click(exportButton)

    // CSV textarea should be populated with header and data
    const csvTextarea = screen.getByLabelText('CSV形式でのきのみ在庫データ')
    const csvValue = (csvTextarea as HTMLTextAreaElement).value
    expect(csvValue).toContain('berryId,count')
    expect(csvValue).toContain('oran-berry,5')
    expect(csvValue).toContain('pecha-berry,3')
  })

  it('should import CSV when import button is clicked', async () => {
    const user = userEvent.setup()

    render(<BerryStockTable {...defaultProps} />)

    const csvTextarea = screen.getByLabelText('CSV形式でのきのみ在庫データ')
    await user.type(csvTextarea, 'oran-berry,15\npecha-berry,8')

    const importButton = screen.getByText('インポート')
    await user.click(importButton)

    // Should reset all stocks first (0), then set imported values
    expect(mockOnStockChange).toHaveBeenCalled()
  })

  it('should render card view on mobile', () => {
    mockUseIsMobile.mockReturnValue(true)

    render(<BerryStockTable {...defaultProps} />)

    // On mobile, we should not see the table element
    expect(screen.queryByRole('table')).not.toBeInTheDocument()

    // But we should still see the berry names
    expect(screen.getByText('オレンのみ')).toBeInTheDocument()
    expect(screen.getByText('モモンのみ')).toBeInTheDocument()
  })

  it('should render table view on desktop', () => {
    mockUseIsMobile.mockReturnValue(false)

    render(<BerryStockTable {...defaultProps} />)

    // On desktop, we should see the table element
    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('should display hyper badge in mobile card view', () => {
    mockUseIsMobile.mockReturnValue(true)

    render(<BerryStockTable {...defaultProps} />)

    expect(screen.getByText('異次元')).toBeInTheDocument()
  })

  it('should sync search text with prop changes', () => {
    const { rerender } = render(<BerryStockTable {...defaultProps} searchText="" />)

    const searchInput = screen.getByLabelText('Search:')
    expect(searchInput).toHaveValue('')

    // Update searchText prop
    rerender(<BerryStockTable {...defaultProps} searchText="オレン" />)

    expect(searchInput).toHaveValue('オレン')
  })

  it('should display filtered berries', () => {
    const filteredBerries = [mockBerries[0]] // Only オレンのみ

    render(<BerryStockTable {...defaultProps} filteredBerries={filteredBerries} />)

    expect(screen.getByText('オレンのみ')).toBeInTheDocument()
    expect(screen.queryByText('モモンのみ')).not.toBeInTheDocument()
    expect(screen.queryByText('異次元きのみ')).not.toBeInTheDocument()
  })

  it('should handle zero stock values', () => {
    const propsWithZeroStocks = {
      ...defaultProps,
      berryStocks: { 'oran-berry': 0, 'pecha-berry': 0, 'hyper-berry': 0 },
    }

    render(<BerryStockTable {...propsWithZeroStocks} />)

    const inputs = screen.getAllByRole('spinbutton')
    // All inputs should show 0
    inputs.forEach(input => {
      expect(input).toHaveValue(0)
    })
  })

  it('should increase berry count with plus button on mobile', async () => {
    mockUseIsMobile.mockReturnValue(true)
    const user = userEvent.setup()

    render(<BerryStockTable {...defaultProps} />)

    const plusButton = screen.getByLabelText('オレンのみの個数を増やす')
    await user.click(plusButton)

    expect(mockOnStockChange).toHaveBeenCalledWith('oran-berry', 6) // 5 + 1
  })

  it('should decrease berry count with minus button on mobile', async () => {
    mockUseIsMobile.mockReturnValue(true)
    const user = userEvent.setup()

    render(<BerryStockTable {...defaultProps} />)

    const minusButton = screen.getByLabelText('オレンのみの個数を減らす')
    await user.click(minusButton)

    expect(mockOnStockChange).toHaveBeenCalledWith('oran-berry', 4) // 5 - 1
  })

  it('should not decrease below zero with minus button on mobile', async () => {
    mockUseIsMobile.mockReturnValue(true)
    const user = userEvent.setup()

    const propsWithZeroStock = {
      ...defaultProps,
      berryStocks: { 'oran-berry': 0, 'pecha-berry': 3 },
    }

    render(<BerryStockTable {...propsWithZeroStock} />)

    const minusButton = screen.getByLabelText('オレンのみの個数を減らす')
    await user.click(minusButton)

    expect(mockOnStockChange).toHaveBeenCalledWith('oran-berry', 0) // stays at 0
  })
})
