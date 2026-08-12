import { useState, useRef, useCallback, useEffect } from 'react'

// Module-level singleton audio instance
let globalAudio = null

// 已预取的音频 URL 集合，避免重复预取
const prefetchedUrls = new Set()

/**
 * 预取音频文件：用 link rel=prefetch 让浏览器空闲时下载，连播时无需等待。
 */
function prefetchAudio(url) {
  if (!url || prefetchedUrls.has(url)) return
  prefetchedUrls.add(url)
  try {
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.as = 'fetch'
    link.href = url
    link.crossOrigin = 'anonymous'
    document.head.appendChild(link)
  } catch {
    // 预取失败不影响主流程
  }
}

export function useAudioPlayer() {
  const [playingId, setPlayingId] = useState(null)
  const [currentQuote, setCurrentQuote] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [playlist, setPlaylist] = useState([])
  const [playlistIndex, setPlaylistIndex] = useState(-1)
  const volumeRef = useRef(0.8)
  const animRef = useRef(null)
  const playlistRef = useRef([])
  const playlistIndexRef = useRef(-1)

  // Keep refs in sync
  useEffect(() => {
    playlistRef.current = playlist
  }, [playlist])

  useEffect(() => {
    playlistIndexRef.current = playlistIndex
  }, [playlistIndex])

  // Sync volume to audio element
  useEffect(() => {
    if (globalAudio) {
      globalAudio.volume = volume
    }
    volumeRef.current = volume
  }, [volume])

  // Progress animation loop
  const startProgressLoop = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current)
    const tick = () => {
      if (globalAudio && !globalAudio.paused) {
        setCurrentTime(globalAudio.currentTime)
        setProgress(globalAudio.currentTime)
        setDuration(globalAudio.duration || 0)
      }
      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
  }, [])

  const stopProgressLoop = useCallback(() => {
    if (animRef.current) {
      cancelAnimationFrame(animRef.current)
      animRef.current = null
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (globalAudio) {
        globalAudio.pause()
        globalAudio.currentTime = 0
        globalAudio = null
      }
      stopProgressLoop()
    }
  }, [stopProgressLoop])

  // Internal play function
  const playInternal = useCallback((id, audioUrl, quoteInfo, autoAdvance = false) => {
    if (!audioUrl) return

    // Toggle: same quote → pause/resume (only if not auto-advancing)
    if (!autoAdvance && playingId === id && globalAudio) {
      if (globalAudio.paused) {
        globalAudio.play()
        setIsPlaying(true)
        startProgressLoop()
      } else {
        globalAudio.pause()
        setIsPlaying(false)
        stopProgressLoop()
      }
      return
    }

    // Stop current
    if (globalAudio) {
      globalAudio.pause()
      globalAudio.currentTime = 0
      stopProgressLoop()
    }

    const audio = new Audio(audioUrl)
    globalAudio = audio
    audio.volume = volumeRef.current

    setPlayingId(id)
    setCurrentQuote(quoteInfo)
    setIsPlaying(true)
    setProgress(0)
    setCurrentTime(0)

    audio.onloadedmetadata = () => {
      setDuration(audio.duration || 0)
    }

    audio.play().catch(() => {
      setPlayingId(null)
      setIsPlaying(false)
      setCurrentQuote(null)
    })

    audio.onended = () => {
      // Auto-play next in playlist
      const pl = playlistRef.current
      const idx = playlistIndexRef.current
      if (pl.length > 0 && idx >= 0 && idx < pl.length - 1) {
        const nextIdx = idx + 1
        setPlaylistIndex(nextIdx)
        playlistIndexRef.current = nextIdx
        const next = pl[nextIdx]
        // Use setTimeout to avoid calling play during onended callback
        setTimeout(() => {
          playInternal(next.id, next.url, next.info, true)
        }, 100)
      } else {
        setIsPlaying(false)
        setPlayingId(null)
        setCurrentTime(0)
        setProgress(0)
        stopProgressLoop()
        if (globalAudio === audio) globalAudio = null
      }
    }

    audio.onerror = () => {
      setIsPlaying(false)
      setPlayingId(null)
      setCurrentQuote(null)
      stopProgressLoop()
      if (globalAudio === audio) globalAudio = null
    }

    // 预取播放列表中下一条音频，连播时更顺滑
    const pl = playlistRef.current
    const idx = playlistIndexRef.current
    if (autoAdvance && pl.length > 0 && idx >= 0 && idx < pl.length - 1) {
      prefetchAudio(pl[idx + 1]?.url)
    }

    startProgressLoop()
  }, [playingId, startProgressLoop, stopProgressLoop])

  // Public play function
  const play = useCallback((id, audioUrl, quoteInfo = null) => {
    playInternal(id, audioUrl, quoteInfo, false)
  }, [playInternal])

  const togglePlay = useCallback(() => {
    if (!globalAudio) return
    if (globalAudio.paused) {
      globalAudio.play()
      setIsPlaying(true)
      startProgressLoop()
    } else {
      globalAudio.pause()
      setIsPlaying(false)
      stopProgressLoop()
    }
  }, [startProgressLoop, stopProgressLoop])

  const seek = useCallback((time) => {
    if (globalAudio) {
      globalAudio.currentTime = time
      setCurrentTime(time)
      setProgress(time)
    }
  }, [])

  const stop = useCallback(() => {
    if (globalAudio) {
      globalAudio.pause()
      globalAudio.currentTime = 0
      globalAudio = null
    }
    stopProgressLoop()
    setPlayingId(null)
    setCurrentQuote(null)
    setIsPlaying(false)
    setProgress(0)
    setCurrentTime(0)
    setDuration(0)
    setPlaylist([])
    setPlaylistIndex(-1)
  }, [stopProgressLoop])

  // Playlist navigation
  const playNext = useCallback(() => {
    const pl = playlistRef.current
    const idx = playlistIndexRef.current
    if (pl.length === 0 || idx < 0 || idx >= pl.length - 1) return
    const nextIdx = idx + 1
    setPlaylistIndex(nextIdx)
    playlistIndexRef.current = nextIdx
    const next = pl[nextIdx]
    playInternal(next.id, next.url, next.info, true)
  }, [playInternal])

  const playPrev = useCallback(() => {
    const pl = playlistRef.current
    const idx = playlistIndexRef.current
    if (pl.length === 0 || idx <= 0) return
    const prevIdx = idx - 1
    setPlaylistIndex(prevIdx)
    playlistIndexRef.current = prevIdx
    const prev = pl[prevIdx]
    playInternal(prev.id, prev.url, prev.info, true)
  }, [playInternal])

  // Set playlist (called from ChampionDetail)
  const updatePlaylist = useCallback((list, currentIdx) => {
    setPlaylist(list)
    setPlaylistIndex(currentIdx >= 0 ? currentIdx : 0)
    playlistRef.current = list
    playlistIndexRef.current = currentIdx >= 0 ? currentIdx : 0
  }, [])

  const hasPrev = playlist.length > 0 && playlistIndex > 0
  const hasNext = playlist.length > 0 && playlistIndex < playlist.length - 1

  return {
    playingId,
    currentQuote,
    isPlaying,
    progress,
    duration,
    currentTime,
    volume,
    hasPrev,
    hasNext,
    play,
    togglePlay,
    seek,
    stop,
    setVolume,
    playNext,
    playPrev,
    updatePlaylist,
  }
}
