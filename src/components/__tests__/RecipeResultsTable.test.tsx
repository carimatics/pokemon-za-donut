import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { userEvent } from '@testing-library/user-event'
import { RecipeResultsTable } from '../RecipeResultsTable'
import type { RecipeRow } from '@/lib/types'
import * as csv from '@/lib/csv'

// Mock useMediaQuery hook
vi.mock('@/hooks/useMediaQuery', () => ({
  useIsMobile: vi.fn(() => false), // Default to desktop
}))

// Mock TanStack Virtual to return all items in tests
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: vi.fn((options) => {
    // Return a mock virtualizer that renders all items
    const count = options.count || 0
    const items = Array.from({ length: count }, (_, index) => ({
      key: index,
      index,
      start: index * (options.estimateSize() || 50),
      size: options.estimateSize() || 50,
      end: (index + 1) * (options.estimateSize() || 50),
    }))

    return {
      getTotalSize: () => count * (options.estimateSize() || 50),
      getVirtualItems: () => items,
      scrollToIndex: vi.fn(),
      scrollToOffset: vi.fn(),
      measure: vi.fn(),
      measureElement: vi.fn(), // Add measureElement for dynamic sizing
    }
  }),
}))

import { useIsMobile } from '@/hooks/useMediaQuery'

const mockUseIsMobile = useIsMobile as ReturnType<typeof vi.fn>

// Mock CSV functions
vi.mock('@/lib/csv', () => ({
  recipeRowsToCSV: vi.fn((rows) => {
    // Simple mock implementation
    return `donutName,recipeIndex,berries
${rows.map((r: RecipeRow) => `${r.donutName},${r.recipeIndex},"${r.berries}"`).join('\n')}`
  }),
  downloadCSV: vi.fn(),
}))

const mockRecipeRows: RecipeRow[] = [
  {
    donutName: 'プレーンドーナツ',
    recipeIndex: 1,
    berries: 'オレンのみ x5',
    totalCalories: 100,
    totalLevel: 5,
    sweet: 50,
    spicy: 0,
    sour: 0,
    bitter: 0,
    fresh: 0,
    stars: 0,
    plusLevel: 5,
    donutEnergy: 100,
  },
  {
    donutName: 'プレーンドーナツ',
    recipeIndex: 2,
    berries: 'モモンのみ x3, オレンのみ x2',
    totalCalories: 120,
    totalLevel: 10,
    sweet: 20,
    spicy: 30,
    sour: 0,
    bitter: 0,
    fresh: 0,
    stars: 1,
    plusLevel: 11,
    donutEnergy: 132,
  },
  {
    donutName: 'スイートドーナツ',
    recipeIndex: 1,
    berries: 'ナナのみ x10',
    totalCalories: 1000,
    totalLevel: 100,
    sweet: 300,
    spicy: 200,
    sour: 200,
    bitter: 200,
    fresh: 60,
    stars: 5,
    plusLevel: 150,
    donutEnergy: 1500,
  },
]

describe('RecipeResultsTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseIsMobile.mockReturnValue(false) // Default to desktop
  })

  it('should render the component title', () => {
    render(<RecipeResultsTable recipeRows={[]} />)

    expect(screen.getByText('レシピ検索結果')).toBeInTheDocument()
  })

  it('should display empty state message when no recipes and no search conditions', () => {
    render(<RecipeResultsTable recipeRows={[]} />)

    expect(screen.getByText('ドーナツ選択タブでドーナツを選択し、レシピを検索してください。')).toBeInTheDocument()
  })

  it('should display no results message when search was performed but no recipes found', () => {
    const searchConditions = {
      selectedDonuts: ['プレーンドーナツ'],
      slots: 3,
      berryCount: 5,
    }

    render(<RecipeResultsTable recipeRows={[]} searchConditions={searchConditions} />)

    expect(screen.getByText('選択されたドーナツに対して、条件を満たすレシピが見つかりませんでした。')).toBeInTheDocument()
  })

  it('should display search results summary with count and time', () => {
    const { container } = render(<RecipeResultsTable recipeRows={mockRecipeRows} searchTime={1.234} />)

    // Check the summary text exists in the component
    const summaryDiv = container.querySelector('.text-sm.text-gray-600')
    expect(summaryDiv).toBeInTheDocument()
    expect(summaryDiv?.textContent).toContain('3')
    expect(summaryDiv?.textContent).toContain('件の結果を')
    expect(summaryDiv?.textContent).toContain('1.234')
    expect(summaryDiv?.textContent).toContain('秒で計算しました')
  })

  it('should not display search results summary when searchTime is null', () => {
    render(<RecipeResultsTable recipeRows={mockRecipeRows} searchTime={null} />)

    expect(screen.queryByText('件の結果を')).not.toBeInTheDocument()
  })

  it('should display search conditions when provided', () => {
    const searchConditions = {
      selectedDonuts: ['プレーンドーナツ', 'スイートドーナツ'],
      slots: 5,
      berryCount: 10,
    }

    const { container } = render(<RecipeResultsTable recipeRows={mockRecipeRows} searchConditions={searchConditions} />)

    expect(screen.getByText('検索条件')).toBeInTheDocument()

    // Check the conditions container
    const conditionsDiv = container.querySelector('.bg-gray-50.border.border-gray-200.rounded-lg')
    expect(conditionsDiv).toBeInTheDocument()
    expect(conditionsDiv?.textContent).toContain('選択ドーナツ:')
    expect(conditionsDiv?.textContent).toContain('プレーンドーナツ、スイートドーナツ')
    expect(conditionsDiv?.textContent).toContain('スロット数:')
    expect(conditionsDiv?.textContent).toContain('5')
    expect(conditionsDiv?.textContent).toContain('使用可能きのみ:')
    expect(conditionsDiv?.textContent).toContain('10種類')
  })

  it('should not display search conditions when no recipes', () => {
    const searchConditions = {
      selectedDonuts: ['プレーンドーナツ'],
      slots: 3,
      berryCount: 5,
    }

    render(<RecipeResultsTable recipeRows={[]} searchConditions={searchConditions} />)

    expect(screen.queryByText('検索条件')).not.toBeInTheDocument()
  })

  it('should display CSV download button when recipes exist', () => {
    render(<RecipeResultsTable recipeRows={mockRecipeRows} />)

    expect(screen.getByText('CSVダウンロード')).toBeInTheDocument()
  })

  it('should not display CSV download button when no recipes', () => {
    render(<RecipeResultsTable recipeRows={[]} />)

    expect(screen.queryByText('CSVダウンロード')).not.toBeInTheDocument()
  })

  it('should call CSV download functions when download button is clicked', async () => {
    const user = userEvent.setup()

    render(<RecipeResultsTable recipeRows={mockRecipeRows} />)

    const downloadButton = screen.getByText('CSVダウンロード')
    await user.click(downloadButton)

    // Verify CSV functions were called (recipes will be sorted by donut order)
    expect(csv.recipeRowsToCSV).toHaveBeenCalledTimes(1)
    const csvCall = (csv.recipeRowsToCSV as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(csvCall).toHaveLength(mockRecipeRows.length)
    expect(csv.downloadCSV).toHaveBeenCalled()
    const downloadCall = (csv.downloadCSV as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(downloadCall[1]).toMatch(/^pokemon-za-recipes-.*\.csv$/)
  })

  it('should render table view on desktop', () => {
    mockUseIsMobile.mockReturnValue(false)

    render(<RecipeResultsTable recipeRows={mockRecipeRows} />)

    // Should see column headers (virtualized table uses divs instead of table element)
    expect(screen.getByText('ドーナツ')).toBeInTheDocument()
    expect(screen.getByText('レシピ#')).toBeInTheDocument()
    expect(screen.getByText('使用きのみ')).toBeInTheDocument()
    expect(screen.getByText('合計カロリー')).toBeInTheDocument()
    expect(screen.getByText('合計レベル')).toBeInTheDocument()
    expect(screen.getByText('スイート')).toBeInTheDocument()
    expect(screen.getByText('スパイシー')).toBeInTheDocument()
    expect(screen.getByText('サワー')).toBeInTheDocument()
    expect(screen.getByText('ビター')).toBeInTheDocument()
    expect(screen.getByText('フレッシュ')).toBeInTheDocument()
    expect(screen.getByText('星')).toBeInTheDocument()
    expect(screen.getByText('プラスレベル')).toBeInTheDocument()
    expect(screen.getByText('ハラモチエネルギー')).toBeInTheDocument()
  })

  it('should render card view on mobile', () => {
    mockUseIsMobile.mockReturnValue(true)

    render(<RecipeResultsTable recipeRows={mockRecipeRows} />)

    // Should see recipe cards (multiple instances expected)
    const plainDonutCards = screen.getAllByText('プレーンドーナツ')
    expect(plainDonutCards.length).toBeGreaterThan(0)
    expect(screen.getByText('スイートドーナツ')).toBeInTheDocument()
  })

  it('should display all recipe data in table cells', () => {
    mockUseIsMobile.mockReturnValue(false)

    const { container } = render(<RecipeResultsTable recipeRows={mockRecipeRows} />)

    // Check first recipe data (プレーンドーナツ appears twice)
    const plainDonutCells = screen.getAllByText('プレーンドーナツ')
    expect(plainDonutCells.length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('オレンのみ x5')).toBeInTheDocument()

    // Check third recipe data with stars
    expect(screen.getByText('スイートドーナツ')).toBeInTheDocument()
    expect(screen.getByText('ナナのみ x10')).toBeInTheDocument()

    // Check for numeric values (virtualized table uses divs)
    const contentText = container.textContent || ''
    expect(contentText).toContain('100')
    expect(contentText).toContain('5')
    expect(contentText).toContain('50')
    expect(contentText).toContain('1000')
    expect(contentText).toContain('150')
    expect(contentText).toContain('1500')
  })

  it('should display stars correctly (0 stars shows dash)', () => {
    mockUseIsMobile.mockReturnValue(false)

    const { container } = render(<RecipeResultsTable recipeRows={mockRecipeRows} />)

    // Should show star symbols in the virtualized table
    const contentText = container.textContent || ''
    expect(contentText).toContain('-') // 0 stars
    expect(contentText).toContain('★') // 1 star
    expect(contentText).toContain('★★★★★') // 5 stars
  })

  it('should display stars in mobile card view', () => {
    mockUseIsMobile.mockReturnValue(true)

    render(<RecipeResultsTable recipeRows={mockRecipeRows} />)

    // Should see star symbols in mobile view
    expect(screen.getByText('★')).toBeInTheDocument()
    expect(screen.getByText('★★★★★')).toBeInTheDocument()
  })

  it('should allow sorting columns in table view', async () => {
    mockUseIsMobile.mockReturnValue(false)
    const user = userEvent.setup()

    render(<RecipeResultsTable recipeRows={mockRecipeRows} />)

    // Click on "合計カロリー" header to sort
    const caloriesHeader = screen.getByText('合計カロリー')
    await user.click(caloriesHeader)

    // Should show sort indicator (↑ or ↓)
    // After first click, it should sort ascending
    expect(caloriesHeader.parentElement?.textContent).toMatch(/[↑↓]/)
  })

  it('should display recipe index for each recipe', () => {
    mockUseIsMobile.mockReturnValue(false)

    const { container } = render(<RecipeResultsTable recipeRows={mockRecipeRows} />)

    // Recipe indices should be displayed (virtualized table uses divs)
    const contentText = container.textContent || ''
    expect(contentText).toContain('1')
    expect(contentText).toContain('2')
  })

  it('should display flavor values for all five flavors', () => {
    mockUseIsMobile.mockReturnValue(false)

    render(<RecipeResultsTable recipeRows={mockRecipeRows} />)

    // Check that all flavor columns are present
    expect(screen.getByText('スイート')).toBeInTheDocument()
    expect(screen.getByText('スパイシー')).toBeInTheDocument()
    expect(screen.getByText('サワー')).toBeInTheDocument()
    expect(screen.getByText('ビター')).toBeInTheDocument()
    expect(screen.getByText('フレッシュ')).toBeInTheDocument()

    // Check specific flavor values from third recipe (using getAllByText since 200 appears multiple times)
    expect(screen.getByText('300')).toBeInTheDocument() // sweet
    const cells200 = screen.getAllByText('200') // spicy, sour, bitter (all 200)
    expect(cells200.length).toBeGreaterThanOrEqual(3)
    expect(screen.getByText('60')).toBeInTheDocument() // fresh
  })

  it('should display plus level and donut energy when stars > 0', () => {
    mockUseIsMobile.mockReturnValue(true)

    render(<RecipeResultsTable recipeRows={mockRecipeRows} />)

    // Check mobile view displays plus level and energy (multiple cards may have these)
    const plusLevelElements = screen.getAllByText('プラスレベル')
    expect(plusLevelElements.length).toBeGreaterThan(0)

    const haramochiElements = screen.getAllByText('ハラモチ')
    expect(haramochiElements.length).toBeGreaterThan(0)
  })

  it('should format berries text correctly in mobile view', () => {
    mockUseIsMobile.mockReturnValue(true)

    render(<RecipeResultsTable recipeRows={mockRecipeRows} />)

    expect(screen.getByText('オレンのみ x5')).toBeInTheDocument()
    expect(screen.getByText('モモンのみ x3, オレンのみ x2')).toBeInTheDocument()
    expect(screen.getByText('ナナのみ x10')).toBeInTheDocument()
  })

  it('should display multiple recipes for the same donut', () => {
    mockUseIsMobile.mockReturnValue(true)

    render(<RecipeResultsTable recipeRows={mockRecipeRows} />)

    // プレーンドーナツ has 2 recipes (index 1 and 2)
    const recipeLabels = screen.getAllByText(/レシピ #/)
    expect(recipeLabels.length).toBeGreaterThanOrEqual(2)

    // Multiple donuts can have recipe #1, so use getAllByText
    const recipe1Elements = screen.getAllByText('レシピ #1')
    expect(recipe1Elements.length).toBeGreaterThan(0)

    expect(screen.getByText('レシピ #2')).toBeInTheDocument()
  })

  it('should handle large numbers with proper formatting', () => {
    const { container } = render(<RecipeResultsTable recipeRows={mockRecipeRows} searchTime={123.456789} />)

    // searchTime should be formatted to 3 decimal places
    const summaryDiv = container.querySelector('.text-sm.text-gray-600')
    expect(summaryDiv?.textContent).toContain('123.457')
  })
})
