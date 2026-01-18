import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { userEvent } from '@testing-library/user-event'
import { DonutSelectionTable } from '../DonutSelectionTable'

// Mock useMediaQuery hook
vi.mock('@/hooks/useMediaQuery', () => ({
  useIsMobile: vi.fn(() => false), // Default to desktop
}))

// Mock donuts data
vi.mock('@/data/donuts', () => ({
  donuts: [
    {
      id: 'plain-donut',
      name: 'プレーンドーナツ',
      flavors: { sweet: 100, spicy: 50, sour: 30, bitter: 20, fresh: 10 },
    },
    {
      id: 'chocolate-donut',
      name: 'チョコドーナツ',
      flavors: { sweet: 120, spicy: 40, sour: 25, bitter: 30, fresh: 15 },
    },
  ],
}))

import { useIsMobile } from '@/hooks/useMediaQuery'

const mockUseIsMobile = useIsMobile as ReturnType<typeof vi.fn>

describe('DonutSelectionTable', () => {
  const mockOnDonutToggle = vi.fn()
  const mockOnSlotsChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseIsMobile.mockReturnValue(false) // Default to desktop
  })

  it('should render donut selection table with all donuts', () => {
    render(
      <DonutSelectionTable
        selectedDonuts={new Set()}
        onDonutToggle={mockOnDonutToggle}
        slots={3}
        onSlotsChange={mockOnSlotsChange}
      />
    )

    expect(screen.getByText('ドーナツ選択')).toBeInTheDocument()
    expect(screen.getByText('プレーンドーナツ')).toBeInTheDocument()
    expect(screen.getByText('チョコドーナツ')).toBeInTheDocument()
  })

  it('should display slots input with correct value', () => {
    render(
      <DonutSelectionTable
        selectedDonuts={new Set()}
        onDonutToggle={mockOnDonutToggle}
        slots={5}
        onSlotsChange={mockOnSlotsChange}
      />
    )

    const slotsInput = screen.getByLabelText('利用できるきのみ数:')
    expect(slotsInput).toHaveValue(5)
  })

  it('should call onSlotsChange when slots input changes', async () => {
    const user = userEvent.setup()

    render(
      <DonutSelectionTable
        selectedDonuts={new Set()}
        onDonutToggle={mockOnDonutToggle}
        slots={3}
        onSlotsChange={mockOnSlotsChange}
      />
    )

    const slotsInput = screen.getByLabelText('利用できるきのみ数:')

    // Clear and type a single digit to avoid multi-keystroke issues
    await user.clear(slotsInput)
    await user.type(slotsInput, '7')

    // Verify onSlotsChange was called
    expect(mockOnSlotsChange).toHaveBeenCalled()
    // Verify the last call was with a number
    const lastCall = mockOnSlotsChange.mock.calls[mockOnSlotsChange.mock.calls.length - 1]
    expect(typeof lastCall[0]).toBe('number')
  })

  it('should call onDonutToggle when donut checkbox is clicked', async () => {
    const user = userEvent.setup()

    render(
      <DonutSelectionTable
        selectedDonuts={new Set()}
        onDonutToggle={mockOnDonutToggle}
        slots={3}
        onSlotsChange={mockOnSlotsChange}
      />
    )

    const checkbox = screen.getByLabelText('プレーンドーナツを選択')
    await user.click(checkbox)

    expect(mockOnDonutToggle).toHaveBeenCalledWith('plain-donut')
  })

  it('should display guide card when no donuts are selected', () => {
    render(
      <DonutSelectionTable
        selectedDonuts={new Set()}
        onDonutToggle={mockOnDonutToggle}
        slots={3}
        onSlotsChange={mockOnSlotsChange}
      />
    )

    expect(screen.getByText('使い方')).toBeInTheDocument()
  })

  it('should not display guide card when donuts are selected', () => {
    render(
      <DonutSelectionTable
        selectedDonuts={new Set(['plain-donut'])}
        onDonutToggle={mockOnDonutToggle}
        slots={3}
        onSlotsChange={mockOnSlotsChange}
      />
    )

    expect(screen.queryByText('使い方')).not.toBeInTheDocument()
  })

  it('should show checkboxes as checked for selected donuts', () => {
    render(
      <DonutSelectionTable
        selectedDonuts={new Set(['plain-donut', 'chocolate-donut'])}
        onDonutToggle={mockOnDonutToggle}
        slots={3}
        onSlotsChange={mockOnSlotsChange}
      />
    )

    const plainCheckbox = screen.getByLabelText('プレーンドーナツを選択')
    const chocolateCheckbox = screen.getByLabelText('チョコドーナツを選択')

    expect(plainCheckbox).toBeChecked()
    expect(chocolateCheckbox).toBeChecked()
  })

  it('should render card view on mobile', () => {
    mockUseIsMobile.mockReturnValue(true)

    render(
      <DonutSelectionTable
        selectedDonuts={new Set()}
        onDonutToggle={mockOnDonutToggle}
        slots={3}
        onSlotsChange={mockOnSlotsChange}
      />
    )

    // On mobile, we should not see the table element
    expect(screen.queryByRole('table')).not.toBeInTheDocument()

    // But we should still see the donut names
    expect(screen.getByText('プレーンドーナツ')).toBeInTheDocument()
    expect(screen.getByText('チョコドーナツ')).toBeInTheDocument()
  })

  it('should render table view on desktop', () => {
    mockUseIsMobile.mockReturnValue(false)

    render(
      <DonutSelectionTable
        selectedDonuts={new Set()}
        onDonutToggle={mockOnDonutToggle}
        slots={3}
        onSlotsChange={mockOnSlotsChange}
      />
    )

    // On desktop, we should see the table element
    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('should enforce minimum slots value of 1', async () => {
    const user = userEvent.setup()

    render(
      <DonutSelectionTable
        selectedDonuts={new Set()}
        onDonutToggle={mockOnDonutToggle}
        slots={3}
        onSlotsChange={mockOnSlotsChange}
      />
    )

    const slotsInput = screen.getByLabelText('利用できるきのみ数:')
    await user.clear(slotsInput)
    await user.type(slotsInput, '0')

    // Should call with 1 instead of 0
    expect(mockOnSlotsChange).toHaveBeenCalledWith(1)
  })

  it('should highlight selected donuts in mobile card view', () => {
    mockUseIsMobile.mockReturnValue(true)

    const { container } = render(
      <DonutSelectionTable
        selectedDonuts={new Set(['plain-donut'])}
        onDonutToggle={mockOnDonutToggle}
        slots={3}
        onSlotsChange={mockOnSlotsChange}
      />
    )

    // Find the card containing プレーンドーナツ
    const plainCard = container.querySelector('.border-blue-500')
    expect(plainCard).toBeInTheDocument()
    expect(plainCard).toHaveClass('bg-blue-50')
  })
})
