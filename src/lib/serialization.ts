/**
 * Serialize a Set to JSON
 */
export function serializeSet<T>(set: Set<T>): string {
  return JSON.stringify(Array.from(set))
}

/**
 * Deserialize JSON to a Set
 */
export function deserializeSet<T>(json: string): Set<T> {
  try {
    const array = JSON.parse(json)
    return new Set(array)
  } catch {
    return new Set()
  }
}
