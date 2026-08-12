import { useState, useMemo, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Navbar from './components/Navbar'
import HeroSection from './components/HeroSection'
import RoleTabs, { filterByRole } from './components/RoleTabs'
import ChampionCard from './components/ChampionCard'
import ChampionDetail from './components/ChampionDetail'
import PlayerBar from './components/PlayerBar'
import { useAudioPlayer } from './hooks/useAudioPlayer'
import { useDebouncedValue } from './hooks/useDebouncedValue'
import { useTheme } from './hooks/useTheme'
import { API_BASE, buildAudioUrl, buildAvatarUrl } from './utils/audioUrl'
import { searchQuotes, resolveAudioForSearchResult, loadFeaturedQuotes } from './utils/search'

export default function App() {
  const [champions, setChampions] = useState([])
  const [search, setSearch] = useState('')
  const [activeRole, setActiveRole] = useState('all')
  const [selectedChampion, setSelectedChampion] = useState(null)
  const [allQuotes, setAllQuotes] = useState([])
  const {
    playingId, currentQuote, isPlaying, progress, duration, currentTime, volume,
    hasPrev, hasNext,
    play, togglePlay, seek, stop, setVolume, playNext, playPrev, updatePlaylist,
  } = useAudioPlayer()
  const { theme, toggleTheme } = useTheme()

  // Load champion list
  useEffect(() => {
    fetch(`${API_BASE}/data/champions.json`)
      .then((r) => r.json())
      .then((data) => {
        setChampions(data)
        // Restore champion from URL hash on initial load
        const hash = window.location.hash
        const match = hash.match(/^#\/champion\/(.+)$/)
        if (match) {
          const champName = decodeURIComponent(match[1])
          const champ = data.find((c) => c.name === champName)
          if (champ) setSelectedChampion(champ)
        }
      })
      .catch(console.error)
  }, [])

  // Listen for browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash
      const match = hash.match(/^#\/champion\/(.+)$/)
      if (match) {
        const champName = decodeURIComponent(match[1])
        const champ = champions.find((c) => c.name === champName)
        if (champ) {
          setSelectedChampion(champ)
          setSearch('')
        }
      } else {
        // Back to home
        stop()
        setSelectedChampion(null)
        setAllQuotes([])
        setSearch('')
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [champions, stop])

  // Load all quotes for selected champion
  useEffect(() => {
    if (!selectedChampion) { setAllQuotes([]); return }
    fetch(`${API_BASE}/data/quotes/${selectedChampion.file}`)
      .then((r) => r.json())
      .then(setAllQuotes)
      .catch(console.error)
  }, [selectedChampion])

  // Total quote count across all champions
  const totalQuoteCount = useMemo(() => {
    return champions.reduce((sum, c) => sum + (c.quoteCount || 0), 0)
  }, [champions])

  // 全局键盘快捷键：空格=播放/暂停，←/→=上下首，Esc=关闭播放器
  // 输入框聚焦时不响应（避免和搜索框冲突）
  useEffect(() => {
    const handler = (e) => {
      const tag = (e.target?.tagName || '').toLowerCase()
      if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return
      if (!currentQuote) return
      switch (e.key) {
        case ' ':
        case 'Spacebar':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowRight':
          if (hasNext) { e.preventDefault(); playNext() }
          break
        case 'ArrowLeft':
          if (hasPrev) { e.preventDefault(); playPrev() }
          break
        case 'Escape':
          stop()
          break
        default:
          break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [currentQuote, togglePlay, playNext, playPrev, stop, hasNext, hasPrev])

  // Filter champions by role + search
  const filteredChampions = useMemo(() => {
    let list = filterByRole(champions, activeRole)
    if (search.trim()) {
      const term = search.toLowerCase()
      list = list.filter((c) =>
        c.name.toLowerCase().includes(term) ||
        c.alias.toLowerCase().includes(term)
      )
    }
    return list
  }, [champions, activeRole, search])

  // Search across all quotes (when search is active and no champion selected)
  // 使用 search_index.json（一次性加载，单例缓存）+ 防抖，避免逐英雄 fetch。
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [resolvingId, setResolvingId] = useState(null)
  const debouncedSearch = useDebouncedValue(search, 250)

  useEffect(() => {
    const term = debouncedSearch.trim()
    if (!term || selectedChampion) {
      setSearchResults([])
      setSearching(false)
      return
    }
    let cancelled = false
    setSearching(true)
    searchQuotes(term, champions, { limit: 80 })
      .then((results) => {
        if (cancelled) return
        setSearchResults(results)
        setSearching(false)
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Search failed:', err)
        setSearchResults([])
        setSearching(false)
      })
    return () => { cancelled = true }
  }, [debouncedSearch, champions, selectedChampion])

  // Surprise Me — 从社区评选的"经典台词"候选池中随机一条
  const handleSurprise = useCallback(async () => {
    if (champions.length === 0) return
    const champMap = new Map(champions.map((c) => [c.name, c]))

    // 先尝试经典台词池（featured_quotes.json，含 dir/file 可直接播放）
    try {
      const featured = await loadFeaturedQuotes()
      if (featured && featured.length > 0) {
        // 避免连续抽到同一条：若上一条是 featured，本轮避开
        const lastId = currentQuote ? `${currentQuote.championName}|${currentQuote.text}` : null
        const pool = featured.length > 1
          ? featured.filter((q) => `${q.champion}|${q.text}` !== lastId)
          : featured
        const pick = pool[Math.floor(Math.random() * pool.length)]
        const champ = champMap.get(pick.champion) || { name: pick.champion, alias: '' }
        const quoteId = `${pick.champion}|${pick.text}|${pick.skin}`
        const audioUrl = buildAudioUrl(pick.dir, pick.file)
        play(quoteId, audioUrl, {
          championName: pick.champion,
          championAlias: champ.alias,
          text: pick.text,
          skin: pick.skin,
        })
        return
      }
    } catch (e) {
      console.warn('Featured pool unavailable, fallback to random champion:', e)
    }

    // Fallback: 随机英雄 + 该英雄的台词（原逻辑）
    const randChamp = champions[Math.floor(Math.random() * champions.length)]
    try {
      const r = await fetch(`${API_BASE}/data/quotes/${randChamp.file}`)
      const quotes = await r.json()
      const playable = quotes.filter((q) => q.dir && q.file)
      if (playable.length === 0) return

      let pool = playable.filter((q) => {
        const t = q.text || ''
        if (t.includes('（') || t.includes('(')) return false
        if (t.length < 15) return false
        if (['攻击', '移动', '阵亡', '暴击', '大笑', '玩笑'].includes(q.event)) return false
        return true
      })

      if (pool.length === 0) {
        pool = playable.filter((q) => {
          const t = q.text || ''
          return !(t.includes('（') || t.includes('(')) && t.length >= 8
        })
      }
      if (pool.length === 0) {
        pool = playable.filter((q) => !(q.text || '').includes('（') && !(q.text || '').includes('('))
      }
      if (pool.length === 0) pool = playable

      const randQuote = pool[Math.floor(Math.random() * pool.length)]
      const quoteId = `${randChamp.name}|${randQuote.text}|${randQuote.skin}`
      const audioUrl = buildAudioUrl(randQuote.dir, randQuote.file)
      play(quoteId, audioUrl, {
        championName: randChamp.name,
        championAlias: randChamp.alias,
        text: randQuote.text,
        skin: randQuote.skin,
      })
    } catch (e) {
      console.error('Surprise failed:', e)
    }
  }, [champions, play, currentQuote])

  // Select champion for detail view
  const handleSelectChampion = (champ) => {
    stop()
    setSelectedChampion(champ)
    setSearch('')
    window.history.pushState({ champion: champ.name }, '', `#/champion/${encodeURIComponent(champ.name)}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBack = () => {
    stop()
    setSelectedChampion(null)
    setAllQuotes([])
    setSearch('')
    window.history.pushState(null, '', '#/')
  }

  return (
    <div className={`min-h-screen ${currentQuote ? 'pb-20' : 'pb-8'}`}>
      {/* Navbar */}
      <Navbar search={search} onSearchChange={setSearch} theme={theme} onToggleTheme={toggleTheme} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ========== HOME VIEW ========== */}
        {!selectedChampion && (
          <>
            {/* Hero Section */}
            <HeroSection
              onSurprise={handleSurprise}
              championCount={champions.length}
              quoteCount={totalQuoteCount}
            />

            {/* Search Results */}
            {search.trim() && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left: Matched Champions */}
                  <div className="lg:col-span-1">
                    <p className="text-xs text-hex-text-dim uppercase tracking-wider mb-3">
                      找到 {filteredChampions.length} 位英雄
                    </p>
                    {filteredChampions.length > 0 ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        <AnimatePresence mode="popLayout">
                          {filteredChampions.map((champ, i) => (
                            <ChampionCard
                              key={champ.name}
                              champion={champ}
                              index={i}
                              onSelect={handleSelectChampion}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-hex-navy/20 rounded-lg border border-hex-gold/5">
                        <p className="text-xs text-hex-text-dim">无匹配英雄</p>
                      </div>
                    )}
                  </div>

                  {/* Right: Matched Quotes */}
                  <div className="lg:col-span-2">
                    <p className="text-xs text-hex-text-dim uppercase tracking-wider mb-3">
                      找到 {searchResults.length} 条台词
                      {searching && <span className="ml-2 text-hex-cyan animate-pulse">搜索中...</span>}
                    </p>
                    {searchResults.length > 0 ? (
                      <div className="space-y-2">
                        {searchResults.slice(0, 50).map((q, i) => {
                          const quoteId = `${q.championName}|${q.text}|${q.skin}`
                          const isPlayingQuote = playingId === quoteId
                          const isResolving = resolvingId === quoteId
                          return (
                            <motion.div
                              key={`${q.championName}-${q.text}-${i}`}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: Math.min(i * 0.02, 0.3) }}
                              onClick={async () => {
                                if (isResolving) return
                                setResolvingId(quoteId)
                                try {
                                  const audioUrl = await resolveAudioForSearchResult(q)
                                  if (!audioUrl) return
                                  play(quoteId, audioUrl, {
                                    championName: q.championName,
                                    championAlias: q.championAlias,
                                    text: q.text,
                                    skin: q.skin,
                                  })
                                } finally {
                                  setResolvingId(null)
                                }
                              }}
                              className={`quote-row ${isPlayingQuote ? 'playing' : ''}`}
                            >
                              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-hex-gold/20">
                                <img
                                  src={buildAvatarUrl(q.championAlias)}
                                  alt={q.championName}
                                  className="w-full h-full object-cover"
                                  onError={(e) => { e.target.style.display = 'none' }}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm truncate ${isPlayingQuote ? 'text-hex-cyan' : 'text-hex-text'}`}>
                                  {q.text}
                                </p>
                                <p className="text-xs text-hex-text-dim truncate">
                                  {q.championName} {q.skin ? `· ${q.skin}` : ''}
                                </p>
                              </div>
                              <div className={`
                                w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0
                                ${isPlayingQuote ? 'bg-hex-cyan text-hex-dark' : 'bg-hex-gold/10 text-hex-gold/40'}
                              `}>
                                {isPlayingQuote ? (
                                  <div className="sound-wave">
                                    <span /><span /><span /><span />
                                  </div>
                                ) : (
                                  <svg className="w-3 h-3 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                  </svg>
                                )}
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="text-5xl mb-3 opacity-20">🔇</div>
                        <p className="text-sm text-hex-text-dim">
                          {!searching ? `未找到"${search}"相关结果` : '搜索中...'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Role Tabs + Champion Grid — only when not searching */}
            {!search.trim() && (
              <>
                <RoleTabs
                  activeRole={activeRole}
                  onRoleChange={setActiveRole}
                  champions={champions}
                />

                <p className="text-xs text-hex-text-dim/60 text-center mb-6">
                  {filteredChampions.length} 位英雄
                </p>

                {/* Champion Avatar Grid */}
                <div className="grid grid-cols-2 min-[420px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4">
                  {filteredChampions.map((champ, i) => (
                    <ChampionCard
                      key={champ.name}
                      champion={champ}
                      index={i}
                      onSelect={handleSelectChampion}
                    />
                  ))}
                </div>

                {filteredChampions.length === 0 && (
                  <div className="text-center py-20">
                    <div className="text-6xl mb-4 opacity-20">🔇</div>
                    <p className="text-sm text-hex-text-dim">没有找到英雄</p>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ========== CHAMPION DETAIL VIEW ========== */}
        {selectedChampion && (
          <ChampionDetail
            champion={selectedChampion}
            quotes={allQuotes}
            playingId={playingId}
            onPlay={play}
            onBack={handleBack}
            onSetPlaylist={updatePlaylist}
          />
        )}
      </main>

      {/* Footer (global, non-endorsement) */}
      <footer className="mt-16 border-t border-hex-gold/10 pt-8 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-px w-12 bg-hex-gold/20" />
            <div className="w-1.5 h-1.5 rotate-45 bg-hex-gold/30" />
            <div className="h-px w-12 bg-hex-gold/20" />
          </div>
          <p className="text-sm text-hex-text mb-3">Rune Voice &middot; 符文之声</p>

          {/* Riot Games official Third Party / Fan Project boilerplate */}
          <p className="text-xs leading-relaxed max-w-3xl mx-auto text-hex-text-dim">
            Rune Voice isn't endorsed by Riot Games and doesn't reflect the
            views or opinions of Riot Games or anyone officially involved in
            producing or managing Riot Games properties.
          </p>
          <p className="text-xs leading-relaxed max-w-3xl mx-auto mt-2 text-hex-text-dim">
            Riot Games and all associated properties are trademarks or
            registered trademarks of Riot Games, Inc.
          </p>

          {/* Project's own License note (MIT scope clarification) */}
          <p className="text-xs leading-relaxed max-w-3xl mx-auto mt-4 text-hex-text-dim/90">
            The MIT License in this repository applies only to the
            project's original source code and project-authored materials.
            Riot-owned assets, audio, images, trademarks, transcripts, and
            other third-party content are not licensed under MIT.
          </p>

          <p className="text-xs mt-4 text-hex-text-dim/80">
            Source code: <a href="https://github.com/zy1003-deg/rune-voice" className="underline hover:text-hex-gold">MIT License</a>
            {' '}&middot;{' '}
            <a href="/NOTICE.html" className="underline hover:text-hex-gold">NOTICE</a>
            {' '}&middot;{' '}
            Operator-supplied data: subject to that operator's own rights and licenses.
          </p>
        </div>
      </footer>

      {/* Global Player Bar */}
      <AnimatePresence>
        {currentQuote && (
          <PlayerBar
            currentQuote={currentQuote}
            isPlaying={isPlaying}
            progress={progress}
            duration={duration}
            currentTime={currentTime}
            volume={volume}
            onTogglePlay={togglePlay}
            onPrev={playPrev}
            onNext={playNext}
            onVolumeChange={setVolume}
            onSeek={seek}
            onStop={stop}
            hasPrev={hasPrev}
            hasNext={hasNext}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
