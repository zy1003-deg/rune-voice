import { useEffect, useState, useCallback } from 'react'
const KEYS = ['rune-voice-theme', 'runic-echoes-theme']
export function readTheme() {
  try {
    for (const key of KEYS) {
      const saved = localStorage.getItem(key)
      if (saved === 'light' || saved === 'dark') return saved
    }
  } catch {
    /* Storage may be blocked. */
  }
  return 'dark'
}
export function useTheme() {
  const [theme, setTheme] = useState(readTheme)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta)
      meta.setAttribute('content', theme === 'dark' ? '#09121E' : '#F3F5F7')
    try {
      KEYS.forEach((key) => localStorage.setItem(key, theme))
    } catch {
      /* Theme still applies. */
    }
  }, [theme])
  const toggleTheme = useCallback(
    () => setTheme((previous) => (previous === 'dark' ? 'light' : 'dark')),
    [],
  )
  return { theme, toggleTheme }
}
