import { useState, useRef, useCallback, useEffect } from 'react'

// One engine owned by the app. Update queue refs before starting playback.
export function useAudioPlayer() {
  const audioRef = useRef(null),
    currentRef = useRef(null),
    queueRef = useRef([]),
    indexRef = useRef(-1),
    volumeRef = useRef(0.8),
    startRef = useRef(null)
  const [playingId, setPlayingId] = useState(null)
  const [currentQuote, setCurrentQuote] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolumeState] = useState(0.8)
  const [playlist, setPlaylist] = useState([])
  const [playlistIndex, setPlaylistIndex] = useState(-1)
  const [error, setError] = useState('')
  const release = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.onended =
      audio.onerror =
      audio.ontimeupdate =
      audio.onloadedmetadata =
      audio.onplay =
      audio.onpause =
        null
    audio.pause()
    audioRef.current = null
  }, [])
  useEffect(() => release, [release])
  const start = useCallback(
    (id, url, info) => {
      if (!url) return
      release()
      const audio = new Audio(url)
      audioRef.current = audio
      currentRef.current = { id, url, info }
      audio.volume = volumeRef.current
      setPlayingId(id)
      setCurrentQuote(info)
      setCurrentTime(0)
      setDuration(0)
      setIsPlaying(false)
      setError('')
      const fail = () => {
        if (audioRef.current !== audio) return
        setIsPlaying(false)
        setError('暂时无法播放这条音频，请重试或选择其他台词。')
      }
      audio.onloadedmetadata = () => {
        if (audioRef.current === audio)
          setDuration(Number.isFinite(audio.duration) ? audio.duration : 0)
      }
      audio.ontimeupdate = () => {
        if (audioRef.current === audio) setCurrentTime(audio.currentTime || 0)
      }
      audio.onplay = () => {
        if (audioRef.current === audio) {
          setIsPlaying(true)
          setError('')
        }
      }
      audio.onpause = () => {
        if (audioRef.current === audio) setIsPlaying(false)
      }
      audio.onerror = fail
      audio.onended = () => {
        if (audioRef.current !== audio) return
        setIsPlaying(false)
        const nextIndex = indexRef.current + 1,
          next = queueRef.current[nextIndex]
        if (next && indexRef.current >= 0) {
          indexRef.current = nextIndex
          setPlaylistIndex(nextIndex)
          startRef.current(next.id, next.url, next.info)
        }
      }
      try {
        Promise.resolve(audio.play()).catch(fail)
      } catch {
        fail()
      }
    },
    [release],
  )
  startRef.current = start
  const resume = useCallback(() => {
    const audio = audioRef.current,
      item = currentRef.current
    if (!item) return
    if (!audio || audio.error) {
      start(item.id, item.url, item.info)
      return
    }
    if (audio.ended) {
      audio.currentTime = 0
      setCurrentTime(0)
    }
    setError('')
    try {
      Promise.resolve(audio.play()).catch(() => {
        if (audioRef.current === audio) {
          setIsPlaying(false)
          setError('播放未能开始，请再次点击播放。')
        }
      })
    } catch {
      setError('播放未能开始，请再次点击播放。')
    }
  }, [start])
  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (audio && !audio.error && !audio.paused && !audio.ended) {
      audio.pause()
      setIsPlaying(false)
    } else resume()
  }, [resume])
  const play = useCallback(
    (id, url, info) => {
      if (currentRef.current?.id === id && audioRef.current) togglePlay()
      else start(id, url, info)
    },
    [start, togglePlay],
  )
  const updatePlaylist = useCallback((list, index) => {
    const nextIndex = list.length
      ? Math.min(Math.max(index, 0), list.length - 1)
      : -1
    queueRef.current = list
    indexRef.current = nextIndex
    setPlaylist(list)
    setPlaylistIndex(nextIndex)
  }, [])
  const move = useCallback(
    (step) => {
      const index = indexRef.current + step,
        entry = queueRef.current[index]
      if (!entry) return
      indexRef.current = index
      setPlaylistIndex(index)
      start(entry.id, entry.url, entry.info)
    },
    [start],
  )
  const playNext = useCallback(() => move(1), [move])
  const playPrev = useCallback(() => move(-1), [move])
  const seek = useCallback((time) => {
    const audio = audioRef.current
    if (!audio || !Number.isFinite(audio.duration)) return
    const clamped = Math.min(Math.max(time, 0), audio.duration)
    audio.currentTime = clamped
    setCurrentTime(clamped)
  }, [])
  const setVolume = useCallback((value) => {
    const next = Math.max(0, Math.min(value, 1))
    volumeRef.current = next
    setVolumeState(next)
    if (audioRef.current) audioRef.current.volume = next
  }, [])
  const stop = useCallback(() => {
    release()
    currentRef.current = null
    queueRef.current = []
    indexRef.current = -1
    setPlayingId(null)
    setCurrentQuote(null)
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    setPlaylist([])
    setPlaylistIndex(-1)
    setError('')
  }, [release])
  const clearError = useCallback(() => setError(''), [])
  return {
    playingId,
    currentQuote,
    isPlaying,
    duration,
    currentTime,
    progress: currentTime,
    volume,
    playlist,
    playlistIndex,
    error,
    clearError,
    hasPrev: playlistIndex > 0,
    hasNext: playlistIndex >= 0 && playlistIndex < playlist.length - 1,
    play,
    togglePlay,
    updatePlaylist,
    playNext,
    playPrev,
    seek,
    setVolume,
    stop,
  }
}
