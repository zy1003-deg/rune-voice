import { memo } from 'react'
import { buildAvatarUrl } from '../utils/audioUrl'
import Icon from './Icon'
const ChampionCard = memo(function ChampionCard({ champion, onSelect }) {
  return (
    <button
      className="champion-card"
      onClick={() => onSelect(champion)}
      aria-label={`查看${champion.name}的语音`}
    >
      <span className="champion-portrait">
        <span className="portrait-fallback" aria-hidden="true">
          {(champion.alias || champion.name || '?')[0]}
        </span>
        <img
          src={buildAvatarUrl(champion.alias)}
          alt=""
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.visibility = 'hidden'
          }}
        />
      </span>
      <span className="champion-caption">
        <strong>{champion.name}</strong>
        <small>
          {(champion.quoteCount || 0).toLocaleString()} 条语音{' '}
          <Icon name="arrow" size={13} />
        </small>
      </span>
    </button>
  )
})
export default ChampionCard
