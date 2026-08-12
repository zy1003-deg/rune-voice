import { API_BASE, buildAudioUrl } from './audioUrl'

// search_index.json 条目：{ text, champion, event, skin }
// quotes/{英雄}.json 条目：{ text, event, skin, file, dir }

let indexCache = null
let indexPromise = null

/**
 * 加载全局搜索索引（带单例缓存）。返回 [{text, champion, event, skin}]。
 */
export async function loadSearchIndex() {
  if (indexCache) return indexCache
  if (indexPromise) return indexPromise
  indexPromise = fetch(`${API_BASE}/data/search_index.json`)
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return r.json()
    })
    .then((data) => {
      indexCache = data
      return data
    })
    .catch((err) => {
      indexPromise = null
      throw err
    })
  return indexPromise
}

/**
 * 在搜索索引中匹配关键词，返回带英雄别名的命中条目。
 * 去重规则：(champion, text, skin) 三元组唯一。
 * @param {string} term 搜索词
 * @param {Array} champions 英雄列表（用于补 alias 与 file）
 * @param {object} opts { limit }
 */
export async function searchQuotes(term, champions, opts = {}) {
  const limit = opts.limit ?? 80
  const trimmed = (term || '').trim().toLowerCase()
  if (!trimmed) return []

  const index = await loadSearchIndex()
  const champMap = new Map(champions.map((c) => [c.name, c]))

  const results = []
  const seen = new Set()
  for (const item of index) {
    const text = item.text || ''
    if (!text.toLowerCase().includes(trimmed)) continue
    const key = `${item.champion}|${text}|${item.skin}`
    if (seen.has(key)) continue
    seen.add(key)

    const champ = champMap.get(item.champion)
    results.push({
      text,
      event: item.event,
      skin: item.skin,
      championName: item.champion,
      championAlias: champ?.alias || '',
      championFile: champ?.file || `${item.champion}.json`,
    })
    if (results.length >= limit) break
  }
  return results
}

// 单英雄 quotes 文件缓存（搜索结果点击播放时补 dir/file 用）
const quotesFileCache = new Map()

async function loadQuotesForChampion(file) {
  if (quotesFileCache.has(file)) return quotesFileCache.get(file)
  const promise = fetch(`${API_BASE}/data/quotes/${file}`)
    .then((r) => (r.ok ? r.json() : []))
    .catch(() => [])
  quotesFileCache.set(file, promise)
  promise.then((data) => {
    quotesFileCache.set(file, data)
  })
  return promise
}

/**
 * 给搜索结果补全音频 dir/file（按 text+skin 精确匹配英雄 quotes 文件）。
 */
export async function resolveAudioForSearchResult(result) {
  const quotes = await loadQuotesForChampion(result.championFile)
  const match = quotes.find(
    (q) => q.text === result.text && q.skin === result.skin
  )
  if (!match || !match.dir || !match.file) return null
  return buildAudioUrl(match.dir, match.file)
}

// 经典台词候选池（featured_quotes.json），单例缓存
let featuredCache = null
let featuredPromise = null

/**
 * 加载经典台词候选池。这些是社区评选的最火台词，"随机一条"只从中抽取。
 */
export async function loadFeaturedQuotes() {
  if (featuredCache) return featuredCache
  if (featuredPromise) return featuredPromise
  featuredPromise = fetch(`${API_BASE}/data/featured_quotes.json`)
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return r.json()
    })
    .then((data) => {
      featuredCache = data
      return data
    })
    .catch((err) => {
      featuredPromise = null
      throw err
    })
  return featuredPromise
}
