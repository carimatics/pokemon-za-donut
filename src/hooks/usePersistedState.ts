import { useState, useEffect, useCallback } from 'react'

/**
 * Custom hook for persisting state to localStorage
 * @param key - localStorage key
 * @param initialValue - Initial value if no stored value exists
 * @param serialize - Custom serialization function (default: JSON.stringify)
 * @param deserialize - Custom deserialization function (default: JSON.parse)
 */
export function usePersistedState<T>(
  key: string,
  initialValue: T,
  serialize = JSON.stringify,
  deserialize = JSON.parse
): [T, React.Dispatch<React.SetStateAction<T>>, () => void] {
  // Initialize state from localStorage or use initial value
  const [state, setState] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? deserialize(item) : initialValue
    } catch (error) {
      console.warn(`Error loading "${key}" from localStorage:`, error)
      return initialValue
    }
  })

  // Sync state to localStorage whenever it changes
  useEffect(() => {
    try {
      window.localStorage.setItem(key, serialize(state))
    } catch (error) {
      console.warn(`Error saving "${key}" to localStorage:`, error)
    }
  }, [key, state, serialize])

  // Clear function to reset to initial value
  const clear = useCallback(() => {
    setState(initialValue)
    try {
      window.localStorage.removeItem(key)
    } catch (error) {
      console.warn(`Error removing "${key}" from localStorage:`, error)
    }
  }, [key, initialValue])

  return [state, setState, clear]
}
