import { motion, AnimatePresence } from 'framer-motion'
import { buildAvatarUrl } from '../utils/audioUrl'

export default function PlayerBar({
  currentQuote,
  isPlaying,
  progress,
  duration,
  currentTime,
  volume,
  onTogglePlay,
  onPrev,
  onNext,
  onVolumeChange,
  onSeek,
  onStop,
  hasPrev,
  hasNext,
}) {
  if (!currentQuote) return null

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handleProgressClick = (e) => {
    if (!duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    onSeek(percent * duration)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-50
          bg-hex-dark/95 backdrop-blur-xl
          border-t border-hex-gold/15
          shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
      >
        {/* Progress bar (top of player) */}
        <div
          className="w-full h-1 cursor-pointer group/progress"
          onClick={handleProgressClick}
        >
          <div className="progress-track h-full">
            <div
              className="progress-fill"
              style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          {/* Left: Now Playing Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0
              border border-hex-gold/20">
              {currentQuote.championAlias && (
                <img
                  src={buildAvatarUrl(currentQuote.championAlias)}
                  alt={currentQuote.championName}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-hex-gold-light truncate">
                {currentQuote.championName || 'Unknown'}
              </p>
              <p className="text-xs text-hex-text-dim truncate max-w-[160px] sm:max-w-[300px]">
                {currentQuote.text || ''}
              </p>
            </div>
            {currentQuote.skin && (
              <div className="hidden lg:block">
                <span className="text-[10px] text-hex-text-dim/50 bg-hex-navy/40 px-2 py-0.5 rounded-full">
                  {currentQuote.skin}
                </span>
              </div>
            )}
          </div>

          {/* Center: Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={onPrev}
              disabled={!hasPrev}
              aria-label="上一条"
              className={`w-8 h-8 flex items-center justify-center rounded-full
                transition-colors cursor-pointer
                ${hasPrev
                  ? 'text-hex-text-dim hover:text-hex-gold-light'
                  : 'text-hex-text-dim/20 cursor-not-allowed'
                }`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>

            <button
              onClick={onTogglePlay}
              aria-label={isPlaying ? '暂停' : '播放'}
              className="w-10 h-10 flex items-center justify-center rounded-full
                bg-hex-gold/10 border border-hex-gold/30
                text-hex-gold hover:bg-hex-gold/20
                transition-all cursor-pointer
                hover:shadow-[0_0_15px_rgba(200,170,110,0.2)]"
            >
              {isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <button
              onClick={onNext}
              disabled={!hasNext}
              aria-label="下一条"
              className={`w-8 h-8 flex items-center justify-center rounded-full
                transition-colors cursor-pointer
                ${hasNext
                  ? 'text-hex-text-dim hover:text-hex-gold-light'
                  : 'text-hex-text-dim/20 cursor-not-allowed'
                }`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>
          </div>

          {/* Right: Time + Volume */}
          <div className="flex items-center gap-3 flex-1 justify-end">
            <span className="text-xs text-hex-text-dim tabular-nums hidden sm:inline">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onVolumeChange(volume > 0 ? 0 : 0.8)}
                aria-label={volume > 0 ? '静音' : '取消静音'}
                className="text-hex-text-dim hover:text-hex-gold-light transition-colors cursor-pointer"
              >
                {volume > 0 ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                  </svg>
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                aria-label="音量"
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                className="hextech-range hidden sm:block"
              />
            </div>

            <button
              onClick={onStop}
              aria-label="关闭播放器"
              className="w-8 h-8 flex items-center justify-center rounded-full
                text-hex-text-dim hover:text-red-400 transition-colors cursor-pointer ml-1"
              title="关闭播放器"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
