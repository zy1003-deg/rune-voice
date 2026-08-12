import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { buildAudioUrl, buildAvatarUrl, API_BASE } from '../audioUrl.js'

describe('audioUrl utils', () => {
  beforeEach(() => {
    // Reset VITE_API_BASE for each test. Default falls back to '/demo-data'.
    vi.stubEnv('VITE_API_BASE', '')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('buildAudioUrl encodes path segments safely', () => {
    // encodeURIComponent encodes special chars (incl. spaces and unicode)
    // so URLs are safe to embed in HTML attributes.
    expect(buildAudioUrl('alpha/Default Skin', 'demo_voice_001.mp3')).toBe(
      '/demo-data/alpha/Default%20Skin/demo_voice_001.mp3'
    )
  })

  it('buildAudioUrl preserves simple ASCII path segments unchanged', () => {
    expect(buildAudioUrl('alpha/Default', 'demo_voice_002.mp3')).toBe(
      '/demo-data/alpha/Default/demo_voice_002.mp3'
    )
  })

  it('buildAudioUrl returns empty string for missing parts', () => {
    expect(buildAudioUrl('', 'file.mp3')).toBe('')
    expect(buildAudioUrl('dir/', '')).toBe('')
    expect(buildAudioUrl(null, null)).toBe('')
  })

  it('buildAvatarUrl returns relative /champion/<alias>.png path when no VITE_AVATAR_BASE', () => {
    expect(buildAvatarUrl('alpha')).toBe('/champion/alpha.png')
    expect(buildAvatarUrl('demo_champion')).toBe('/champion/demo_champion.png')
  })

  it('buildAvatarUrl returns empty string for empty alias', () => {
    expect(buildAvatarUrl('')).toBe('')
    expect(buildAvatarUrl(null)).toBe('')
  })

  it('API_BASE defaults to /demo-data when no VITE_API_BASE is set', () => {
    expect(API_BASE).toBe('/demo-data')
  })

  it('buildAvatarUrl honours VITE_AVATAR_BASE when set', () => {
    vi.stubEnv('VITE_AVATAR_BASE', 'https://your-cdn.example.com/avatars')
    // The env is read at call time, not module load — call the function directly.
    // We re-import to pick up the stubbed env (Vitest handles vi.stubEnv per test).
    expect(buildAvatarUrl('alpha')).toBe('https://your-cdn.example.com/avatars/alpha.png')
  })
})
