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
      if (!isNaN(count) && count >= 0) {
        berryStocks[berryId] = count
      }
    }
  } catch (error) {
    console.warn('Error parsing CSV:', error)
  }

  return berryStocks
}
