import { useCallback, useState } from 'react'
import { quoteId } from '../utils/quotes'
const KEY = 'rune-voice-favorites'
export function useFavorites() {
  const [favorites, setFavorites] = useState(() => {
    try {
      const value = JSON.parse(localStorage.getItem(KEY) || '[]')
      return Array.isArray(value)
        ? value.filter((q) => q && typeof q.text === 'string' && q.championName)
        : []
    } catch {
      return []
    }
  })
  const toggleFavorite = useCallback((quote) => {
    setFavorites((previous) => {
      const id = quoteId(quote)
      const next = previous.some((q) => quoteId(q) === id)
        ? previous.filter((q) => quoteId(q) !== id)
        : [quote, ...previous]
      try {
        localStorage.setItem(KEY, JSON.stringify(next))
      } catch {
        /* Storage may be unavailable. */
      }
      return next
    })
  }, [])
  return { favorites, toggleFavorite }
}
