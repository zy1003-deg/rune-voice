import { useState } from 'react'
import Icon from './Icon'
import { buildAvatarUrl } from '../utils/audioUrl'

const formatTime = (value) => {
  const seconds = Number.isFinite(value) ? Math.max(value, 0) : 0
  return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0')}`
}
export default function PlayerBar({
  currentQuote,
  isPlaying,
  duration,
  currentTime,
  volume,
  togglePlay,
  playPrev,
  playNext,
  setVolume,
  seek,
  hasPrev,
  hasNext,
  onStop,
  favorite,
  onFavorite,
  playlist,
  playlistIndex,
  onPlayQueue,
}) {
  const [expanded, setExpanded] = useState(false)
  const [queueOpen, setQueueOpen] = useState(false)
  return (
    <section className="player-bar" aria-label="音频播放器">
      {(expanded || queueOpen) && (
        <div className="player-drawer">
          <div className="drawer-heading">
            <h2>{queueOpen ? `播放队列（${playlist.length}）` : '正在播放'}</h2>
            <button
              className="icon-button"
              aria-label="收起播放器详情"
              onClick={() => {
                setExpanded(false)
                setQueueOpen(false)
              }}
            >
              <Icon name="close" />
            </button>
          </div>
          <div className="drawer-actions">
            <button
              className="outline-button"
              onClick={() => onFavorite(currentQuote)}
            >
              <Icon name="heart" size={16} filled={favorite} />
              {favorite ? '取消收藏' : '收藏台词'}
            </button>
            <button
              className="outline-button"
              onClick={() => setQueueOpen(!queueOpen)}
            >
              <Icon name="queue" size={16} />
              {queueOpen ? '查看完整台词' : '查看播放队列'}
            </button>
            <button
              className="icon-button"
              onClick={() => setVolume(volume ? 0 : 0.8)}
              aria-label={volume ? '静音' : '取消静音'}
            >
              <Icon name={volume ? 'volume' : 'mute'} />
            </button>
            <button
              className="icon-button"
              onClick={onStop}
              aria-label="关闭播放器"
            >
              <Icon name="close" />
            </button>
          </div>
          {queueOpen ? (
            <ol className="queue-list">
              {playlist.map((entry, i) => (
                <li key={`${entry.id}-${i}`}>
                  <button
                    className={i === playlistIndex ? 'active' : ''}
                    aria-current={i === playlistIndex ? 'true' : undefined}
                    onClick={() => onPlayQueue(entry, i)}
                  >
                    <span>{String(i + 1).padStart(2, '0')}</span>
                    <span>
                      {entry.info.text}
                      <small>
                        {entry.info.championName} · {entry.info.skin}
                      </small>
                    </span>
                    {i === playlistIndex && (
                      <Icon name={isPlaying ? 'pause' : 'play'} size={16} />
                    )}
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <div className="now-playing-detail">
              <p>{currentQuote.text}</p>
              <small>
                {currentQuote.championName} · {currentQuote.skin}
              </small>
            </div>
          )}
        </div>
      )}
      <div className="player-inner">
        <button
          className="now-playing"
          aria-expanded={expanded && !queueOpen}
          aria-label="展开当前台词"
          onClick={() => {
            setExpanded(!expanded || queueOpen)
            setQueueOpen(false)
          }}
        >
          <img
            key={currentQuote.championAlias}
            src={buildAvatarUrl(currentQuote.championAlias)}
            alt=""
            onError={(e) => {
              e.currentTarget.style.visibility = 'hidden'
            }}
          />
          <span>
            <strong>{currentQuote.championName}</strong>
            <small>{currentQuote.text}</small>
          </span>
        </button>
        <div className="player-center">
          <div className="player-controls">
            <button
              className="icon-button"
              onClick={playPrev}
              disabled={!hasPrev}
              aria-label="上一条"
            >
              <Icon name="prev" size={19} />
            </button>
            <button
              className="player-toggle"
              onClick={togglePlay}
              aria-label={isPlaying ? '暂停' : '播放'}
            >
              <Icon
                name={isPlaying ? 'pause' : 'play'}
                filled={!isPlaying}
                size={23}
              />
            </button>
            <button
              className="icon-button"
              onClick={playNext}
              disabled={!hasNext}
              aria-label="下一条"
            >
              <Icon name="next" size={19} />
            </button>
          </div>
          <div className="player-timeline">
            <span>{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 1}
              step="0.01"
              value={Math.min(currentTime, duration || 1)}
              disabled={!duration}
              onChange={(e) => seek(Number(e.target.value))}
              aria-label="播放进度"
              style={{
                '--progress': `${duration ? (currentTime / duration) * 100 : 0}%`,
              }}
            />
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        <div className="player-tools">
          <button
            className={`icon-button favorite-button ${favorite ? 'saved' : ''}`}
            aria-label={favorite ? '取消收藏' : '收藏当前台词'}
            aria-pressed={favorite}
            onClick={() => onFavorite(currentQuote)}
          >
            <Icon name="heart" filled={favorite} />
          </button>
          <button
            className={`icon-button ${queueOpen ? 'selected' : ''}`}
            aria-label="播放队列"
            aria-expanded={queueOpen}
            onClick={() => {
              setQueueOpen(!queueOpen)
              setExpanded(false)
            }}
          >
            <Icon name="queue" />
          </button>
          <div className="volume-control">
            <button
              className="icon-button"
              aria-label={volume ? '静音' : '取消静音'}
              onClick={() => setVolume(volume ? 0 : 0.8)}
            >
              <Icon name={volume ? 'volume' : 'mute'} />
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              aria-label="音量"
            />
          </div>
          <button
            className="icon-button stop-player"
            onClick={onStop}
            aria-label="关闭播放器"
          >
            <Icon name="close" size={17} />
          </button>
        </div>
      </div>
    </section>
  )
}
