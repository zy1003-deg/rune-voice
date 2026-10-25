import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, cleanup } from '@testing-library/react'
import { useAudioPlayer } from '../useAudioPlayer'
let instances
class FakeAudio {
  constructor(url) {
    this.src = url
    this.paused = true
    this.ended = false
    this.duration = 7
    this.currentTime = 0
    instances.push(this)
  }
  play() {
    this.paused = false
    this.ended = false
    this.onplay?.()
    return Promise.resolve()
  }
  pause() {
    this.paused = true
    this.onpause?.()
  }
}
const entry = (id) => ({
  id,
  url: '/' + id + '.mp3',
  info: { text: id, championName: 'Hero', skin: 'Default' },
})
beforeEach(() => {
  instances = []
  vi.stubGlobal('Audio', FakeAudio)
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})
describe('continuous audio and queue ownership', () => {
  it('auto-advances using the current queue and resets duration', () => {
    const { result } = renderHook(useAudioPlayer)
    const a = entry('a'),
      b = entry('b')
    act(() => {
      result.current.updatePlaylist([a, b], 0)
      result.current.play(a.id, a.url, a.info)
    })
    act(() => instances[0].onloadedmetadata())
    expect(result.current.duration).toBe(7)
    act(() => instances[0].onended())
    expect(result.current.currentQuote.text).toBe('b')
    expect(result.current.playlistIndex).toBe(1)
    expect(result.current.duration).toBe(0)
    expect(instances[0].paused).toBe(true)
  })
  it('does not resume a previous hero queue after standalone search playback', () => {
    const { result } = renderHook(useAudioPlayer)
    const a = entry('a'),
      b = entry('b'),
      search = entry('search')
    act(() => {
      result.current.updatePlaylist([a, b], 0)
      result.current.play(a.id, a.url, a.info)
    })
    const oldEnded = instances[0].onended
    act(() => {
      result.current.updatePlaylist([search], 0)
      result.current.play(search.id, search.url, search.info)
    })
    act(() => oldEnded())
    expect(result.current.currentQuote.text).toBe('search')
    act(() => instances[1].onended())
    expect(instances).toHaveLength(2)
    expect(result.current.isPlaying).toBe(false)
  })
  it('pauses/resumes the same quote and stops the engine on unmount', () => {
    const { result, unmount } = renderHook(useAudioPlayer)
    const a = entry('a')
    act(() => result.current.play(a.id, a.url, a.info))
    act(() => result.current.play(a.id, a.url, a.info))
    expect(result.current.isPlaying).toBe(false)
    act(() => result.current.togglePlay())
    expect(result.current.isPlaying).toBe(true)
    expect(instances).toHaveLength(1)
    unmount()
    expect(instances[0].paused).toBe(true)
  })
  it('bounds seeking and persists volume across tracks', () => {
    const { result } = renderHook(useAudioPlayer)
    const a = entry('a'),
      b = entry('b')
    act(() => {
      result.current.setVolume(0.3)
      result.current.play(a.id, a.url, a.info)
      result.current.seek(100)
    })
    expect(instances[0].currentTime).toBe(7)
    expect(instances[0].volume).toBe(0.3)
    act(() => result.current.play(b.id, b.url, b.info))
    expect(instances[1].volume).toBe(0.3)
    expect(result.current.currentTime).toBe(0)
  })
  it('reports audio failure and retries without showing fake playback', async () => {
    const { result } = renderHook(useAudioPlayer)
    const a = entry('a')
    act(() => result.current.play(a.id, a.url, a.info))
    act(() => {
      instances[0].error = Error('network')
      instances[0].onerror()
    })
    expect(result.current.isPlaying).toBe(false)
    expect(result.current.error).toBeTruthy()
    act(() => result.current.togglePlay())
    expect(instances).toHaveLength(2)
    expect(result.current.error).toBe('')
    expect(result.current.isPlaying).toBe(true)
  })
})
