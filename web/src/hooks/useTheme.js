import { useEffect, useState, useCallback } from 'react'

const STORAGE_KEY = 'rune-voice-theme'
const THEMES = ['light', 'dark']

/**
 * 主题切换 hook。
 * - 首次访问跟随系统 prefers-color-scheme
 * - 用户切换后持久化到 localStorage
 * - 通过 <html data-theme="..."> 应用
 */
export function useTheme() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light'
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && THEMES.includes(saved)) return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    // 同步 theme-color meta，让移动端浏览器顶栏配色跟随
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#14171C' : '#F4F6F8')
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem(STORAGE_KEY, next)
      return next
    })
  }, [])

  return { theme, toggleTheme }
}
