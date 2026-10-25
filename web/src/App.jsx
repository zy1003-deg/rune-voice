import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import Navbar from './components/Navbar'
import HeroSection from './components/HeroSection'
import RoleTabs, { filterByRole } from './components/RoleTabs'
import ChampionCard from './components/ChampionCard'
import ChampionDetail from './components/ChampionDetail'
import PlayerBar from './components/PlayerBar'
import QuoteRow from './components/QuoteRow'
import Footer from './components/Footer'
import Icon from './components/Icon'
import { useAudioPlayer } from './hooks/useAudioPlayer'
import { useDebouncedValue } from './hooks/useDebouncedValue'
import { useTheme } from './hooks/useTheme'
import { useFavorites } from './hooks/useFavorites'
import { DATA_BASE, buildAudioUrl } from './utils/audioUrl'
import {
  searchQuotes,
  resolveAudioForSearchResult,
  loadFeaturedQuotes,
} from './utils/search'
import { normalizeQuote, quoteId, chooseFeaturedSlots } from './utils/quotes'

function readRoute() {
  const hash = window.location.hash
  const match = hash.match(/^#\/champion\/([^?]+)/)
  let name = null
  try {
    if (match) name = decodeURIComponent(match[1])
  } catch {
    /* Ignore malformed links. */
  }
  const params = new URLSearchParams(hash.split('?')[1] || '')
  return {
    name,
    view: hash.startsWith('#/favorites')
      ? 'favorites'
      : hash.startsWith('#/heroes')
        ? 'heroes'
        : 'discover',
    search: params.get('q') || '',
  }
}

export default function App() {
  const [route, setRoute] = useState(readRoute)
  const [champions, setChampions] = useState([])
  const [search, setSearch] = useState(route.search)
  const [activeRole, setActiveRole] = useState('all')
  const [loadState, setLoadState] = useState('loading')
  const [loadVersion, setLoadVersion] = useState(0)
  const [allQuotes, setAllQuotes] = useState([])
  const [quotesState, setQuotesState] = useState('loading')
  const [quoteVersion, setQuoteVersion] = useState(0)
  const [featured, setFeatured] = useState([])
  const [featuredState, setFeaturedState] = useState('loading')
  const [featuredIndices, setFeaturedIndices] = useState([])
  const [featuredVersion, setFeaturedVersion] = useState(0)
  const [searchResults, setSearchResults] = useState([])
  const [searchState, setSearchState] = useState('idle')
  const [searchVersion, setSearchVersion] = useState(0)
  const [resolvingId, setResolvingId] = useState(null)
  const [notice, setNotice] = useState('')
  const playRequest = useRef(0)
  const player = useAudioPlayer()
  const { theme, toggleTheme } = useTheme()
  const { favorites, toggleFavorite } = useFavorites()
  const savedIds = useMemo(() => new Set(favorites.map(quoteId)), [favorites])
  const selectedChampion = champions.find((c) => c.name === route.name)
  const debouncedSearch = useDebouncedValue(search, 250)

  useEffect(() => {
    let cancelled = false
    setLoadState('loading')
    fetch(`${DATA_BASE}/data/champions.json`)
      .then((r) => {
        if (!r.ok) throw new Error('champions')
        return r.json()
      })
      .then((data) => {
        if (!cancelled) {
          setChampions(data)
          setLoadState('ready')
        }
      })
      .catch(() => {
        if (!cancelled) setLoadState('error')
      })
    return () => {
      cancelled = true
    }
  }, [loadVersion])

  useEffect(() => {
    const sync = () => {
      const next = readRoute()
      setRoute(next)
      setSearch(next.search)
    }
    window.addEventListener('popstate', sync)
    window.addEventListener('hashchange', sync)
    return () => {
      window.removeEventListener('popstate', sync)
      window.removeEventListener('hashchange', sync)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setAllQuotes([])
    if (!selectedChampion) return
    setQuotesState('loading')
    fetch(
      `${DATA_BASE}/data/quotes/${encodeURIComponent(selectedChampion.file)}`,
    )
      .then((r) => {
        if (!r.ok) throw new Error('quotes')
        return r.json()
      })
      .then((data) => {
        if (!cancelled) {
          setAllQuotes(data.map((q) => normalizeQuote(q, selectedChampion)))
          setQuotesState('ready')
        }
      })
      .catch(() => {
        if (!cancelled) setQuotesState('error')
      })
    return () => {
      cancelled = true
    }
  }, [selectedChampion, quoteVersion])

  useEffect(() => {
    if (!champions.length) return
    let cancelled = false
    setFeaturedState('loading')
    loadFeaturedQuotes()
      .then((data) => {
        const map = new Map(champions.map((c) => [c.name, c]))
        const seen = new Set()
        const list = data
          .filter((q) => q.text && q.dir && q.file && map.has(q.champion))
          .map((q) => normalizeQuote(q, map.get(q.champion)))
          .filter((q) => {
            const id = quoteId(q)
            if (seen.has(id)) return false
            seen.add(id)
            return true
          })
        if (!cancelled) {
          setFeatured(list)
          setFeaturedIndices(chooseFeaturedSlots(list))
          setFeaturedState('ready')
        }
      })
      .catch(() => {
        if (!cancelled) setFeaturedState('error')
      })
    return () => {
      cancelled = true
    }
  }, [champions, featuredVersion])

  useEffect(() => {
    if (
      !debouncedSearch.trim() ||
      route.name ||
      route.view === 'favorites' ||
      !champions.length
    ) {
      setSearchResults([])
      setSearchState('idle')
      return
    }
    let cancelled = false
    setSearchState('loading')
    searchQuotes(debouncedSearch, champions, { limit: 80 })
      .then((data) => {
        if (!cancelled) {
          setSearchResults(data)
          setSearchState('ready')
        }
      })
      .catch(() => {
        if (!cancelled) setSearchState('error')
      })
    return () => {
      cancelled = true
    }
  }, [debouncedSearch, champions, route.name, route.view, searchVersion])

  const navigate = (view, champion = null) => {
    const hash = champion
      ? `#/champion/${encodeURIComponent(champion.name)}`
      : view === 'discover'
        ? '#/'
        : `#/${view}`
    window.history.pushState(null, '', hash)
    setRoute({ view, name: champion?.name || null, search: '' })
    setSearch('')
    setNotice('')
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  const playQuote = useCallback(
    async (quote, list = []) => {
      const request = ++playRequest.current
      const id = quoteId(quote)
      setNotice('')
      setResolvingId(id)
      try {
        const url =
          quote.dir && quote.file
            ? buildAudioUrl(quote.dir, quote.file)
            : await resolveAudioForSearchResult(quote)
        if (request !== playRequest.current) return
        if (!url) {
          setNotice('这条台词暂时没有可播放的音频，请试试其他台词。')
          return
        }
        const queue = list
          .filter((q) => q.dir && q.file)
          .map((q) => ({
            id: quoteId(q),
            url: buildAudioUrl(q.dir, q.file),
            info: q,
          }))
        const index = queue.findIndex((q) => q.id === id)
        player.updatePlaylist(
          index >= 0 ? queue : [{ id, url, info: quote }],
          Math.max(index, 0),
        )
        player.play(id, url, quote)
      } catch {
        if (request === playRequest.current)
          setNotice('音频加载失败，请稍后重试。')
      } finally {
        if (request === playRequest.current) setResolvingId(null)
      }
    },
    [player.play, player.updatePlaylist],
  )

  useEffect(() => {
    const handler = (e) => {
      if (
        e.target?.closest?.(
          'input,textarea,select,button,a,[role="button"],[contenteditable="true"]',
        ) ||
        !player.currentQuote
      )
        return
      if (e.key === ' ') {
        e.preventDefault()
        player.togglePlay()
      }
      if (e.key === 'ArrowRight' && player.hasNext) {
        e.preventDefault()
        player.playNext()
      }
      if (e.key === 'ArrowLeft' && player.hasPrev) {
        e.preventDefault()
        player.playPrev()
      }
      if (e.key === 'Escape') {
        ++playRequest.current
        setResolvingId(null)
        player.stop()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [
    player.currentQuote,
    player.togglePlay,
    player.playNext,
    player.playPrev,
    player.stop,
    player.hasNext,
    player.hasPrev,
  ])

  const filteredChampions = useMemo(() => {
    const list = search.trim() ? champions : filterByRole(champions, activeRole)
    const term = search.trim().toLowerCase()
    return list.filter(
      (c) => !term || `${c.name} ${c.alias}`.toLowerCase().includes(term),
    )
  }, [champions, activeRole, search])
  const totalQuoteCount = champions.reduce(
    (sum, c) => sum + (c.quoteCount || 0),
    0,
  )
  const row = (q, list, showChampion = true) => (
    <QuoteRow
      key={quoteId(q)}
      quote={q}
      selected={player.playingId === quoteId(q)}
      isPlaying={player.isPlaying}
      busy={resolvingId === quoteId(q)}
      favorite={savedIds.has(quoteId(q))}
      onFavorite={toggleFavorite}
      onPlay={() => playQuote(q, list)}
      showChampion={showChampion}
      term={search}
    />
  )
  const favoriteResults = favorites.filter((q) =>
    `${q.text} ${q.championName} ${q.skin}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  )
  const isSearching = search.trim() && !route.name && route.view !== 'favorites'
  const errorMessage = notice || player.error

  return (
    <div className={`app-shell ${player.currentQuote ? 'has-player' : ''}`}>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault()
          document.getElementById('main-content')?.focus()
        }}
      >
        跳到主要内容
      </a>
      <Navbar
        search={search}
        onSearchChange={setSearch}
        theme={theme}
        onToggleTheme={toggleTheme}
        view={route.view}
        onNavigate={navigate}
        selectedChampion={selectedChampion}
      />
      <main id="main-content" tabIndex={-1} className="page-container">
        {loadState === 'error' && (
          <div className="empty-state" role="alert">
            <h1>英雄目录加载失败</h1>
            <p>请检查网络连接后重试。</p>
            <button
              className="outline-button"
              onClick={() => setLoadVersion((v) => v + 1)}
            >
              重新加载
            </button>
          </div>
        )}
        {loadState === 'loading' && (
          <div className="empty-state" role="status">
            正在加载英雄语音…
          </div>
        )}
        {loadState === 'ready' && (
          <>
            {route.name ? (
              selectedChampion ? (
                <ChampionDetail
                  key={selectedChampion.name}
                  champion={selectedChampion}
                  quotes={allQuotes}
                  state={quotesState}
                  onRetry={() => setQuoteVersion((v) => v + 1)}
                  search={search}
                  playingId={player.playingId}
                  isPlaying={player.isPlaying}
                  onPlay={playQuote}
                  onBack={() => navigate('heroes')}
                  savedIds={savedIds}
                  onFavorite={toggleFavorite}
                />
              ) : (
                <div className="empty-state">
                  <h1>没有找到这位英雄</h1>
                  <button
                    className="outline-button"
                    onClick={() => navigate('heroes')}
                  >
                    返回英雄目录
                  </button>
                </div>
              )
            ) : route.view === 'favorites' ? (
              <section className="collection-section">
                <div className="section-heading">
                  <div>
                    <h1>我的收藏</h1>
                    <p>收藏的台词会保存在当前浏览器中。</p>
                  </div>
                  <span>{favorites.length} 条台词</span>
                </div>
                {favoriteResults.length ? (
                  <div className="quote-list">
                    {favoriteResults.map((q) => row(q, favoriteResults))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <Icon name="heart" size={34} />
                    <h2>{search ? '没有匹配的收藏' : '还没有收藏台词'}</h2>
                    <p>点击台词旁边的爱心，即可在这里再次聆听。</p>
                    <button
                      className="outline-button"
                      onClick={() => navigate('discover')}
                    >
                      去听台词
                    </button>
                  </div>
                )}
              </section>
            ) : (
              <>
                {route.view === 'discover' && !isSearching && (
                  <HeroSection
                    quotes={featured}
                    indices={featuredIndices}
                    onShuffle={(slot) =>
                      setFeaturedIndices((previous) =>
                        chooseFeaturedSlots(featured, previous, slot),
                      )
                    }
                    onPlay={playQuote}
                    playingId={player.playingId}
                    isPlaying={player.isPlaying}
                    loading={featuredState === 'loading'}
                    error={
                      featuredState === 'error'
                        ? '推荐台词加载失败，英雄目录仍可浏览。'
                        : ''
                    }
                    onRetry={() => setFeaturedVersion((v) => v + 1)}
                    championCount={champions.length}
                    quoteCount={totalQuoteCount}
                  />
                )}
                {isSearching ? (
                  <section className="search-section">
                    <div className="section-heading">
                      <div>
                        <h1>搜索结果</h1>
                        <p>查找“{search}”相关的英雄与台词</p>
                      </div>
                      <button
                        className="text-button"
                        onClick={() => setSearch('')}
                      >
                        清空搜索
                      </button>
                    </div>
                    <div className="search-layout">
                      <div>
                        <h2 className="subheading">
                          英雄 <span>{filteredChampions.length}</span>
                        </h2>
                        {filteredChampions.length ? (
                          <div className="search-hero-grid">
                            {filteredChampions.map((c) => (
                              <ChampionCard
                                key={c.name}
                                champion={c}
                                onSelect={(champ) => navigate('heroes', champ)}
                              />
                            ))}
                          </div>
                        ) : (
                          <p className="muted">没有匹配的英雄，试试英文名。</p>
                        )}
                      </div>
                      <div>
                        <h2 className="subheading">
                          台词{' '}
                          <span>
                            {searchResults.length >= 80
                              ? '80+'
                              : searchResults.length}
                          </span>
                        </h2>
                        {searchState === 'loading' ||
                        debouncedSearch !== search ? (
                          <p role="status" className="muted">
                            正在搜索…
                          </p>
                        ) : searchState === 'error' ? (
                          <div role="alert">
                            <p>搜索加载失败。</p>
                            <button
                              className="outline-button"
                              onClick={() => setSearchVersion((v) => v + 1)}
                            >
                              重新搜索
                            </button>
                          </div>
                        ) : searchResults.length ? (
                          <>
                            <div className="quote-list">
                              {searchResults.map((q) => row(q, searchResults))}
                            </div>
                            {searchResults.length >= 80 && (
                              <p className="muted">
                                已显示前 80 条，输入更具体的词可以缩小范围。
                              </p>
                            )}
                          </>
                        ) : (
                          <div className="empty-state">
                            <h2>没有找到相关台词</h2>
                            <p>试试较短的关键词，例如“风”或“命运”。</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>
                ) : (
                  <section className="heroes-section" id="heroes">
                    <div className="heroes-toolbar">
                      <div className="section-heading">
                        <h2>
                          {route.view === 'heroes' ? '英雄目录' : '选择英雄'}
                        </h2>
                        <span className="section-diamond" aria-hidden="true" />
                      </div>
                      <RoleTabs
                        activeRole={activeRole}
                        onRoleChange={setActiveRole}
                        champions={champions}
                      />
                      <span className="hero-count">
                        {filteredChampions.length} 位英雄
                      </span>
                    </div>
                    <div className="champion-grid">
                      {filteredChampions.map((c) => (
                        <ChampionCard
                          key={c.name}
                          champion={c}
                          onSelect={(champ) => navigate('heroes', champ)}
                        />
                      ))}
                    </div>
                    {!filteredChampions.length && (
                      <div className="empty-state">
                        这个职业暂时没有英雄，试试“全部”。
                      </div>
                    )}
                  </section>
                )}
              </>
            )}
          </>
        )}
      </main>
      {errorMessage && (
        <div className="notice" role="alert">
          <span>{errorMessage}</span>
          <button
            className="icon-button"
            aria-label="关闭提示"
            onClick={() => {
              setNotice('')
              player.clearError()
            }}
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
      <Footer />
      {player.currentQuote && (
        <PlayerBar
          {...player}
          favorite={savedIds.has(quoteId(player.currentQuote))}
          onFavorite={toggleFavorite}
          onPlayQueue={(entry, index) => {
            ++playRequest.current
            player.updatePlaylist(player.playlist, index)
            player.play(entry.id, entry.url, entry.info)
          }}
          onStop={() => {
            ++playRequest.current
            setResolvingId(null)
            player.stop()
          }}
        />
      )}
    </div>
  )
}
