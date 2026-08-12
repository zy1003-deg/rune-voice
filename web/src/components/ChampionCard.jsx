import { memo } from 'react'
import { buildAvatarUrl } from '../utils/audioUrl'

/**
 * Returns the uppercase first letter of an alias or name; used as a
 * CSS placeholder when no portrait file is shipped.
 */
function initialsOf(champion) {
  const source = (champion?.alias || champion?.name || '?').trim()
  return (source[0] || '?').toUpperCase()
}

const ChampionCard = memo(function ChampionCard({
  champion,
  index,
  onSelect,
}) {
  return (
    <div
      onClick={() => onSelect(champion)}
      className="champion-avatar-card group animate-in fade-in slide-in-from-bottom-2 duration-300"
      style={{ animationDelay: `${Math.min(index * 20, 300)}ms`, animationFillMode: 'both' }}
    >
      {/* Champion Image (or initials fallback) */}
      <div className="relative overflow-hidden">
        {/* Initials placeholder — always rendered, behind the image. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center bg-hex-navy text-hex-gold-light font-bold text-3xl select-none"
        >
          {initialsOf(champion)}
        </div>

        <img
          src={buildAvatarUrl(champion.alias)}
          alt={champion.name}
          className="champion-avatar-img relative"
          loading="lazy"
          onError={(e) => {
            e.target.style.display = 'none'
          }}
        />

        {/* Gradient overlay */}
        <div className="champion-avatar-overlay" />

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="text-sm font-bold text-hex-gold-light truncate leading-tight">
            {champion.name}
          </h3>
          <p className="text-[10px] text-hex-text-dim/70 truncate mt-0.5">
            {champion.alias}
          </p>
        </div>

        {/* Quote count badge */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100
          transition-opacity duration-300">
          <div className="flex items-center gap-1 px-2 py-1 rounded-full
            bg-hex-dark/80 backdrop-blur-sm border border-hex-gold/20
            text-[10px] text-hex-gold-light">
            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
            </svg>
            {champion.quoteCount}
          </div>
        </div>

        {/* Skins count badge */}
        {champion.skins && champion.skins.length > 1 && (
          <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100
            transition-opacity duration-300">
            <div className="flex items-center gap-1 px-2 py-1 rounded-full
              bg-hex-dark/80 backdrop-blur-sm border border-hex-cyan/20
              text-[10px] text-hex-cyan">
              {champion.skins.length} skins
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

export default ChampionCard
