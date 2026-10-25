export const quoteId = (q) =>
  `${q.championName || q.champion}|${q.text}|${q.skin || ''}`

export function normalizeQuote(q, champion) {
  return {
    ...q,
    championName: q.championName || q.champion || champion?.name || '',
    championAlias: q.championAlias || champion?.alias || '',
    championFile: q.championFile || champion?.file,
  }
}

// All three cards share one reviewed pool. Prefer distinct heroes and avoid
// the previous group when alternatives exist; never silently expand the pool.
export function chooseFeaturedSlots(
  quotes,
  current = [],
  slot = null,
  random = Math.random,
) {
  const pool = [
    ...new Map(quotes.map((q, index) => [quoteId(q), index])).values(),
  ]
  const count = Math.min(3, pool.length)
  if (!count) return []
  const pick = (items) =>
    items[Math.min(items.length - 1, Math.floor(random() * items.length))]
  const diverse = (items, occupied) => {
    const heroes = new Set(
      occupied.map(
        (index) => quotes[index].championName || quotes[index].champion,
      ),
    )
    const differentHeroes = items.filter(
      (index) =>
        !heroes.has(quotes[index].championName || quotes[index].champion),
    )
    return differentHeroes.length ? differentHeroes : items
  }
  const seen = new Set()
  let selected = current
    .filter((index) => {
      if (!pool.includes(index) || seen.has(quoteId(quotes[index])))
        return false
      seen.add(quoteId(quotes[index]))
      return true
    })
    .slice(0, count)
  if (selected.length !== count) {
    selected = []
    while (selected.length < count) {
      selected.push(
        pick(
          diverse(
            pool.filter((index) => !selected.includes(index)),
            selected,
          ),
        ),
      )
    }
    return selected
  }
  if (slot != null && (!Number.isInteger(slot) || slot < 0 || slot >= count))
    return selected
  if (slot == null && pool.length === count)
    return [...selected.slice(1), selected[0]]
  const previous = new Set(selected)
  const replace = (target, avoid) => {
    const occupied = selected.filter((_, index) => index !== target)
    let candidates = pool.filter(
      (index) => index !== selected[target] && !occupied.includes(index),
    )
    if (!candidates.length) return
    const fresh = candidates.filter((index) => !avoid.has(index))
    if (fresh.length) candidates = fresh
    selected[target] = pick(diverse(candidates, occupied))
  }
  if (slot == null)
    for (let index = 0; index < count; index++) replace(index, previous)
  else replace(slot, previous)
  return selected
}
