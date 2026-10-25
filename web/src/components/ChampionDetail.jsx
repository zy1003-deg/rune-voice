import { useMemo, useState } from 'react'
import { buildAvatarUrl } from '../utils/audioUrl'
import { quoteId } from '../utils/quotes'
import { hasSpokenText } from '../utils/quoteFilter'
import QuoteRow from './QuoteRow'
import Icon from './Icon'

const EVENTS = [
  { key: 'select', label: '英雄选择', events: ['禁用', '选人'] },
  { key: 'move', label: '移动', events: ['移动'] },
  { key: 'attack', label: '攻击', events: ['攻击'] },
  { key: 'kill', label: '击杀', events: ['击杀'] },
  { key: 'encounter', label: '初遇', events: ['初遇'] },
  { key: 'ability', label: '技能', events: ['使用'] },
  { key: 'emote', label: '互动', events: ['嘲讽', '玩笑', '大笑'] },
  { key: 'recall', label: '回城', events: ['回城'] },
  { key: 'respond', label: '回应', events: ['回应'] },
  { key: 'death', label: '阵亡与重生', events: ['阵亡', '重生'] },
  { key: 'trigger', label: '触发效果', events: ['触发', '暴击'] },
  { key: 'other', label: '其他', events: [] },
]
export default function ChampionDetail({
  champion,
  quotes,
  state,
  onRetry,
  search,
  playingId,
  isPlaying,
  onPlay,
  onBack,
  savedIds,
  onFavorite,
}) {
  const [chosenSkin, setChosenSkin] = useState(null)
  const [activeEvent, setActiveEvent] = useState('all')
  const spokenQuotes = useMemo(
    () => quotes.filter((q) => hasSpokenText(q.text)),
    [quotes],
  )
  const skins = useMemo(() => {
    const list = [...new Set(spokenQuotes.map((q) => q.skin).filter(Boolean))]
    return list.some((s) => s !== '默认皮肤')
      ? list.filter((s) => s !== '默认皮肤')
      : list
  }, [spokenQuotes])
  const defaultSkin = skins.find(
    (s) =>
      s === `${champion.name} 默认皮肤` || s === 'Default' || s === '默认皮肤',
  )
  const activeSkin = skins.includes(chosenSkin)
    ? chosenSkin
    : defaultSkin || skins[0] || null
  const groups = useMemo(() => {
    const filtered = spokenQuotes.filter(
      (q) =>
        q.text &&
        (!activeSkin || q.skin === activeSkin || q.skin === '默认皮肤') &&
        q.text.toLowerCase().includes(search.trim().toLowerCase()),
    )
    const map = new Map(EVENTS.map((e) => [e.key, []]))
    filtered.forEach((q) => {
      const key = EVENTS.find((e) => e.events.includes(q.event))?.key || 'other'
      map.get(key).push(q)
    })
    return EVENTS.map((e) => ({ ...e, quotes: map.get(e.key) })).filter(
      (e) => e.quotes.length,
    )
  }, [spokenQuotes, activeSkin, search])
  const effectiveEvent =
    activeEvent === 'all' || groups.some((g) => g.key === activeEvent)
      ? activeEvent
      : 'all'
  const visibleGroups =
    effectiveEvent === 'all'
      ? groups
      : groups.filter((g) => g.key === effectiveEvent)
  const visibleQuotes = visibleGroups.flatMap((g) => g.quotes)
  const total = groups.reduce((n, g) => n + g.quotes.length, 0)

  return (
    <section className="detail-section">
      <button className="back-link" onClick={onBack}>
        <Icon name="back" size={17} />
        返回英雄目录
      </button>
      <div className="detail-layout">
        <aside className="champion-sidebar">
          <div className="detail-identity">
            <div className="detail-avatar">
              <img
                src={buildAvatarUrl(champion.alias)}
                alt=""
                onError={(e) => {
                  e.currentTarget.style.visibility = 'hidden'
                }}
              />
            </div>
            <div>
              <h1>{champion.name}</h1>
              <p>{champion.alias}</p>
              <small>
                {spokenQuotes.length.toLocaleString()} 条台词 · {skins.length}{' '}
                款皮肤
              </small>
            </div>
          </div>
          <nav className="event-navigation" aria-label="台词分类">
            <button
              className={effectiveEvent === 'all' ? 'active' : ''}
              aria-pressed={effectiveEvent === 'all'}
              onClick={() => setActiveEvent('all')}
            >
              全部分类<span>{total}</span>
            </button>
            {groups.map((g) => (
              <button
                key={g.key}
                className={effectiveEvent === g.key ? 'active' : ''}
                aria-pressed={effectiveEvent === g.key}
                onClick={() => setActiveEvent(g.key)}
              >
                {g.label}
                <span>{g.quotes.length}</span>
              </button>
            ))}
          </nav>
        </aside>
        <div className="detail-content">
          <div className="detail-filters">
            <label className="skin-select">
              选择皮肤
              <select
                value={activeSkin || ''}
                disabled={!skins.length}
                onChange={(e) => {
                  setChosenSkin(e.target.value)
                  setActiveEvent('all')
                }}
              >
                {!skins.length && <option value="">暂无皮肤</option>}
                {skins.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <span className="muted">
              {search ? `“${search}” · ` : ''}
              {visibleQuotes.length} 条台词
            </span>
            {visibleQuotes.some((q) => q.dir && q.file) && (
              <button
                className="outline-button"
                onClick={() =>
                  onPlay(
                    visibleQuotes.find((q) => q.dir && q.file),
                    visibleQuotes,
                  )
                }
              >
                <Icon name="play" size={15} />
                播放当前列表
              </button>
            )}
          </div>
          {state === 'loading' ? (
            <div className="empty-state" role="status">
              正在加载英雄台词…
            </div>
          ) : state === 'error' ? (
            <div className="empty-state" role="alert">
              <h2>台词加载失败</h2>
              <button className="outline-button" onClick={onRetry}>
                重新加载
              </button>
            </div>
          ) : visibleGroups.length ? (
            visibleGroups.map((g) => (
              <section className="quote-group" key={g.key}>
                <h2>
                  {g.label}
                  <span>{g.quotes.length}</span>
                </h2>
                <div className="quote-list">
                  {g.quotes.map((q, index) => (
                    <QuoteRow
                      key={quoteId(q) + index}
                      quote={q}
                      selected={playingId === quoteId(q)}
                      isPlaying={isPlaying}
                      onPlay={() => onPlay(q, visibleQuotes)}
                      favorite={savedIds.has(quoteId(q))}
                      onFavorite={onFavorite}
                      term={search}
                      unavailable={!q.dir || !q.file}
                    />
                  ))}
                </div>
              </section>
            ))
          ) : (
            <div className="empty-state">
              <h2>{search ? '没有找到相关台词' : '这个皮肤暂时没有台词'}</h2>
              <p>
                {search
                  ? '试试其他关键词，或清空顶部搜索。'
                  : '可以选择其他皮肤。'}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
