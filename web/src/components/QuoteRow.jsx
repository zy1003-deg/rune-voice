import Icon from './Icon'
import { buildAvatarUrl } from '../utils/audioUrl'
export function Highlight({ text, term }) {
  if (!term?.trim()) return text
  const index = text.toLowerCase().indexOf(term.trim().toLowerCase())
  if (index < 0) return text
  const end = index + term.trim().length
  return (
    <>
      {text.slice(0, index)}
      <mark>{text.slice(index, end)}</mark>
      {text.slice(end)}
    </>
  )
}
export default function QuoteRow({
  quote,
  selected,
  isPlaying,
  onPlay,
  favorite,
  onFavorite,
  showChampion = false,
  term,
  busy = false,
  unavailable = false,
}) {
  return (
    <div className={`quote-row ${selected ? 'playing' : ''}`}>
      <button
        className="quote-play"
        onClick={onPlay}
        disabled={busy || unavailable}
        aria-label={`${selected && isPlaying ? '暂停' : '播放'}：${quote.text}`}
      >
        {showChampion && (
          <img
            src={buildAvatarUrl(quote.championAlias)}
            alt=""
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        )}
        <span className="row-play-icon">
          <Icon
            name={selected && isPlaying ? 'pause' : 'play'}
            size={17}
            filled={!(selected && isPlaying)}
          />
        </span>
        <span className="quote-copy">
          <span>
            <Highlight text={quote.text} term={term} />
          </span>
          {showChampion && (
            <small>
              {quote.championName}
              {quote.skin ? ` · ${quote.skin}` : ''}
            </small>
          )}
          {unavailable && <small>暂无音频</small>}
          {busy && <small>正在加载音频…</small>}
        </span>
      </button>
      <button
        className={`icon-button favorite-button ${favorite ? 'saved' : ''}`}
        onClick={() => onFavorite(quote)}
        aria-label={favorite ? '取消收藏' : '收藏台词'}
        aria-pressed={favorite}
      >
        <Icon name="heart" size={18} filled={favorite} />
      </button>
    </div>
  )
}
