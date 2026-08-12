import { useState, useMemo, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { buildAudioUrl, buildAvatarUrl } from '../utils/audioUrl'

// Event type grouping configuration
const EVENT_GROUPS = [
  { key: 'select', label: '英雄选择', icon: '🎯', events: ['禁用', '选人'] },
  { key: 'move', label: '移动', icon: '🏃', events: ['移动'] },
  { key: 'attack', label: '攻击', icon: '⚔️', events: ['攻击'] },
  { key: 'kill', label: '击杀', icon: '💀', events: ['击杀'] },
  { key: 'encounter', label: '初遇', icon: '👋', events: ['初遇'] },
  { key: 'ability', label: '技能', icon: '✨', events: ['使用'] },
  { key: 'emote', label: '互动', icon: '😄', events: ['嘲讽', '玩笑', '大笑'] },
  { key: 'recall', label: '回城', icon: '🏠', events: ['回城'] },
  { key: 'respond', label: '回应', icon: '💬', events: ['回应'] },
  { key: 'death', label: '阵亡 & 重生', icon: '💫', events: ['阵亡', '重生'] },
  { key: 'trigger', label: '触发效果', icon: '🔥', events: ['触发', '暴击'] },
  { key: 'other', label: '其他', icon: '📝', events: [] }, // catch-all
]

// Map an event string to a group key
function getEventGroupKey(event) {
  if (!event) return 'other'
  for (const group of EVENT_GROUPS) {
    if (group.events.includes(event)) return group.key
  }
  return 'other'
}

export default function ChampionDetail({
  champion,
  quotes,
  playingId,
  onPlay,
  onBack,
  onSetPlaylist,
}) {
  const [activeSkin, setActiveSkin] = useState(null)
  const [expandedGroups, setExpandedGroups] = useState(() => {
    // Default: expand first 3 groups
    const initial = {}
    EVENT_GROUPS.forEach((g, i) => { initial[g.key] = i < 3 })
    return initial
  })

  // Available skins
  const skins = useMemo(() => {
    const skinSet = new Set()
    let hasRealSkins = false
    quotes.forEach((q) => {
      if (q.skin) {
        skinSet.add(q.skin)
        if (q.skin !== '默认皮肤') hasRealSkins = true
      }
    })
    // Hide the isolated "默认皮肤" tab if we have actual skin folders
    if (hasRealSkins) {
      skinSet.delete('默认皮肤')
    }
    return Array.from(skinSet)
  }, [quotes])

  // Auto-select first skin when skins become available or current selection invalid
  useEffect(() => {
    if (skins.length > 0 && (!activeSkin || !skins.includes(activeSkin))) {
      setActiveSkin(skins[0])
    }
  }, [skins, activeSkin])

  // Filter quotes by selected skin + global champion quotes
  const filteredQuotes = useMemo(() => {
    if (!activeSkin) return []
    return quotes.filter((q) =>
      q.skin === activeSkin ||
      // Include champion-level select/ban quotes (under '默认皮肤') in every skin view
      (q.skin === '默认皮肤' && activeSkin !== '默认皮肤')
    )
  }, [quotes, activeSkin])

  // Group quotes by event type
  const groupedQuotes = useMemo(() => {
    const groups = {}
    EVENT_GROUPS.forEach((g) => { groups[g.key] = [] })

    filteredQuotes.forEach((q) => {
      if (!q.text) return
      const key = getEventGroupKey(q.event)
      groups[key].push(q)
    })

    // Return only non-empty groups
    return EVENT_GROUPS
      .filter((g) => groups[g.key].length > 0)
      .map((g) => ({
        ...g,
        quotes: groups[g.key],
      }))
  }, [filteredQuotes])

  const toggleGroup = useCallback((key) => {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const expandAll = useCallback(() => {
    setExpandedGroups((prev) => {
      const next = { ...prev }
      EVENT_GROUPS.forEach((g) => { next[g.key] = true })
      return next
    })
  }, [])

  const collapseAll = useCallback(() => {
    setExpandedGroups((prev) => {
      const next = { ...prev }
      EVENT_GROUPS.forEach((g) => { next[g.key] = false })
      return next
    })
  }, [])

  const handlePlayQuote = useCallback((quote, groupQuotes) => {
    if (!quote.dir || !quote.file) return
    const quoteId = `${champion.name}|${quote.text}|${quote.skin}`
    const audioUrl = buildAudioUrl(quote.dir, quote.file)

    // Set playlist for this group
    if (onSetPlaylist && groupQuotes) {
      const playlist = groupQuotes
        .filter((q) => q.dir && q.file)
        .map((q) => ({
          id: `${champion.name}|${q.text}|${q.skin}`,
          url: buildAudioUrl(q.dir, q.file),
          info: {
            championName: champion.name,
            championAlias: champion.alias,
            text: q.text,
            skin: q.skin,
          },
        }))
      const currentIndex = playlist.findIndex((p) => p.id === quoteId)
      onSetPlaylist(playlist, currentIndex)
    }

    onPlay(quoteId, audioUrl, {
      championName: champion.name,
      championAlias: champion.alias,
      text: quote.text,
      skin: quote.skin,
    })
  }, [champion, onPlay, onSetPlaylist])

  const totalFiltered = filteredQuotes.filter((q) => q.text).length

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="pt-20"
    >
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={onBack}
        className="back-btn mb-6"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        返回英雄列表
      </motion.button>

      {/* Champion Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-5 mb-8"
      >
        <div className="w-20 h-20 rounded-full overflow-hidden
          border-2 border-hex-gold/40 flex-shrink-0
          shadow-[0_0_20px_rgba(200,170,110,0.2)]">
          <img
            src={buildAvatarUrl(champion.alias)}
            alt={champion.name}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.style.display = 'none' }}
          />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-hex-gold-light glow-gold-text">
            {champion.name}
          </h2>
          <p className="text-sm text-hex-text-dim mt-1">
            {champion.alias}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <span className="stat-badge">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
              </svg>
              {totalFiltered} 条语音
            </span>
            <span className="stat-badge">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              {skins.length} 款皮肤
            </span>
          </div>
        </div>
      </motion.div>

      {/* Skin Tabs */}
      {skins.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6"
        >
          <p className="text-[10px] text-hex-text-dim/60 uppercase tracking-wider mb-2">
            选择皮肤
          </p>
          <div className="skin-tabs-scroll">
            {skins.map((skin) => (
              <button
                key={skin}
                onClick={() => setActiveSkin(skin)}
                className={`skin-tab ${activeSkin === skin ? 'active' : ''}`}
              >
                {skin}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Expand/Collapse All */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-hex-text-dim/60">
          {groupedQuotes.length} 个分类 · {totalFiltered} 条台词
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="text-[10px] text-hex-text-dim hover:text-hex-cyan transition-colors cursor-pointer
              px-2 py-1 rounded border border-hex-gold/5 hover:border-hex-cyan/20"
          >
            全部展开
          </button>
          <button
            onClick={collapseAll}
            className="text-[10px] text-hex-text-dim hover:text-hex-cyan transition-colors cursor-pointer
              px-2 py-1 rounded border border-hex-gold/5 hover:border-hex-cyan/20"
          >
            全部折叠
          </button>
        </div>
      </div>

      {/* Event Groups */}
      <div className="space-y-3">
        {groupedQuotes.map((group, gi) => (
          <motion.div
            key={group.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(gi * 0.05, 0.4) }}
          >
            {/* Group Header */}
            <div
              onClick={() => toggleGroup(group.key)}
              className="event-group-header"
            >
              <svg
                className={`event-group-chevron w-4 h-4 text-hex-text-dim ${expandedGroups[group.key] ? 'open' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-base">{group.icon}</span>
              <span className="text-sm font-medium text-hex-gold-light">
                {group.label}
              </span>
              <span className="text-[10px] text-hex-text-dim/60 bg-hex-navy/50 px-2 py-0.5 rounded-full ml-auto">
                {group.quotes.length}
              </span>
            </div>

            {/* Group Quotes */}
            <AnimatePresence>
              {expandedGroups[group.key] && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="pl-4 pt-2 space-y-1">
                    {group.quotes.map((q, qi) => {
                      const quoteId = `${champion.name}|${q.text}|${q.skin}`
                      const isPlaying = playingId === quoteId
                      const hasAudio = q.dir && q.file

                      return (
                        <div
                          key={`${q.skin}-${q.event}-${q.text}-${qi}`}
                          role={hasAudio ? 'button' : undefined}
                          tabIndex={hasAudio ? 0 : undefined}
                          aria-label={hasAudio ? `播放：${q.text}` : undefined}
                          aria-pressed={isPlaying}
                          onClick={() => hasAudio && handlePlayQuote(q, group.quotes)}
                          onKeyDown={(e) => {
                            if (!hasAudio) return
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              handlePlayQuote(q, group.quotes)
                            }
                          }}
                          className={`quote-row ${isPlaying ? 'playing' : ''} ${!hasAudio ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          {/* Play indicator */}
                          <div className={`
                            w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0
                            transition-all duration-200
                            ${isPlaying
                              ? 'bg-hex-cyan text-hex-dark'
                              : 'bg-hex-gold/10 text-hex-gold/40'
                            }
                          `}>
                            {isPlaying ? (
                              <div className="sound-wave">
                                <span /><span /><span /><span />
                              </div>
                            ) : (
                              <svg className="w-3 h-3 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            )}
                          </div>

                          {/* Quote text */}
                          <div className="flex-1 min-w-0">
                            <p className={`
                              text-sm leading-relaxed
                              ${isPlaying ? 'text-hex-cyan' : 'text-hex-text-dim'}
                            `}>
                              {q.text}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Empty state */}
      {groupedQuotes.length === 0 && quotes.length > 0 && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4 opacity-20">🔇</div>
          <p className="text-sm text-hex-text-dim">
            {activeSkin ? `"${activeSkin}" 没有语音数据` : '暂无语音数据'}
          </p>
        </div>
      )}

      {/* Loading state */}
      {quotes.length === 0 && (
        <div className="space-y-3 mt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded-lg shimmer" />
          ))}
        </div>
      )}
    </motion.div>
  )
}
