import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, cleanup } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { useTheme, readTheme } from '../useTheme'
const html = readFileSync('index.html', 'utf8')
const boot = html
  .match(/<script>\s*\/\/ 主题初始化[\s\S]*?<\/script>/)[0]
  .replace(/<\/?script>/g, '')
beforeEach(() => {
  localStorage.clear()
  document.head.innerHTML = '<meta name="theme-color" content="">'
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})
describe('theme migration and first paint', () => {
  it.each(['light', 'dark'])(
    'keeps legacy %s and migrates both keys',
    (theme) => {
      localStorage.setItem('runic-echoes-theme', theme)
      Function(boot)()
      expect(document.documentElement.dataset.theme).toBe(theme)
      const { result } = renderHook(useTheme)
      expect(result.current.theme).toBe(theme)
      expect(localStorage.getItem('rune-voice-theme')).toBe(theme)
      act(() => result.current.toggleTheme())
      const next = theme === 'dark' ? 'light' : 'dark'
      expect(localStorage.getItem('runic-echoes-theme')).toBe(next)
      expect(document.documentElement.dataset.theme).toBe(next)
    },
  )
  it('prefers a valid current key and defaults new visitors to dark', () => {
    expect(readTheme()).toBe('dark')
    localStorage.setItem('rune-voice-theme', 'dark')
    localStorage.setItem('runic-echoes-theme', 'light')
    expect(readTheme()).toBe('dark')
    localStorage.setItem('rune-voice-theme', 'invalid')
    expect(readTheme()).toBe('light')
  })
  it('works when browser storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw Error('blocked')
    })
    expect(() => Function(boot)()).not.toThrow()
    const { result } = renderHook(useTheme)
    expect(result.current.theme).toBe('dark')
    act(() => result.current.toggleTheme())
    expect(result.current.theme).toBe('light')
  })
})
