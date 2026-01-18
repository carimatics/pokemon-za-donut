import type { RecipeRow } from '@/lib/types'

/**
 * Convert berry stocks to CSV format
 */
export function berryStocksToCSV(berryStocks: Record<string, number>): string {
  const rows: string[] = ['berryId,count']

  for (const [berryId, count] of Object.entries(berryStocks)) {
    if (count > 0) {
      rows.push(`${berryId},${count}`)
    }
  }

  return rows.join('\n')
}

/**
 * Parse CSV and convert to berry stocks
 */
export function csvToBerryStocks(csv: string): Record<string, number> {
  const berryStocks: Record<string, number> = {}

  try {
    const lines = csv.trim().split('\n')

    // Skip header if present
    const startIndex = lines[0]?.toLowerCase().includes('berryid') ? 1 : 0

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const [berryId, countStr] = line.split(',').map(s => s.trim())
      if (!berryId) continue

      const count = parseInt(countStr, 10)
      if (!Number.isNaN(count) && count >= 0) {
        berryStocks[berryId] = count
      }
    }
  } catch (error) {
    console.warn('Error parsing CSV:', error)
  }

  return berryStocks
}

/**
 * Convert recipe rows to CSV format
 */
export function recipeRowsToCSV(recipeRows: RecipeRow[]): string {
  const rows: string[] = [
    'ドーナツ,レシピ#,使用きのみ,合計カロリー,合計レベル,Sweet,Spicy,Sour,Bitter,Fresh'
  ]

  for (const row of recipeRows) {
    const csvRow = [
      escapeCSVField(row.donutName),
      row.recipeIndex,
      escapeCSVField(row.berries),
      row.totalCalories,
      row.totalLevel,
      row.sweet,
      row.spicy,
      row.sour,
      row.bitter,
      row.fresh,
    ].join(',')

    rows.push(csvRow)
  }

  return rows.join('\n')
}

/**
 * Escape CSV field if it contains special characters
 */
function escapeCSVField(field: string): string {
  // If field contains comma, newline, or quotes, wrap in quotes and escape existing quotes
  if (field.includes(',') || field.includes('\n') || field.includes('"')) {
    return `"${field.replace(/"/g, '""')}"`
  }
  return field
}

/**
 * Download CSV content as a file
 */
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}
