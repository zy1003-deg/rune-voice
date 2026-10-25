import { describe, expect, it } from 'vitest'
import { chooseFeaturedSlots, quoteId } from '../quotes'

const pool = Array.from({ length: 12 }, (_, index) => ({
  championName: 'Hero' + Math.floor(index / 2),
  text: 'Reviewed quote ' + index,
  skin: 'Default',
}))

describe('shared reviewed recommendation pool', () => {
  it('initializes three different heroes without fixed Yasuo/Jhin/Ahri slots', () => {
    const selected = chooseFeaturedSlots(pool, [], null, () => 0)
    expect(selected).toHaveLength(3)
    expect(new Set(selected.map((i) => pool[i].championName)).size).toBe(3)
    expect(chooseFeaturedSlots([], [], null, () => 0)).toEqual([])
  })

  it.each([0, 1, 2])(
    'independently replaces card %i from the same pool',
    (slot) => {
      const previous = [0, 2, 4]
      const next = chooseFeaturedSlots(pool, previous, slot, () => 0)
      expect(next[slot]).not.toBe(previous[slot])
      previous.forEach((index, i) => {
        if (i !== slot) expect(next[i]).toBe(index)
      })
      expect(new Set(next).size).toBe(3)
      expect(previous).toEqual([0, 2, 4])
    },
  )

  it('refreshes all three and avoids the entire preceding group when possible', () => {
    const previous = [0, 2, 4]
    const next = chooseFeaturedSlots(pool, previous, null, () => 0)
    next.forEach((index, slot) => {
      expect(index).not.toBe(previous[slot])
      expect(previous).not.toContain(index)
    })
    expect(new Set(next).size).toBe(3)
  })

  it('handles a tiny pool without repeats or an infinite loop', () => {
    expect(chooseFeaturedSlots(pool.slice(0, 1), [0])).toEqual([0])
    expect(chooseFeaturedSlots(pool.slice(0, 2), [0, 1])).toEqual([1, 0])
    expect(chooseFeaturedSlots(pool.slice(0, 3), [0, 1, 2])).toEqual([1, 2, 0])
    expect(chooseFeaturedSlots(pool.slice(0, 3), [0, 1, 2], 1)).toEqual([
      0, 1, 2,
    ])
  })

  it('never leaves the reviewed pool or displays duplicate entries after repeated changes', () => {
    let selected = chooseFeaturedSlots(pool)
    const ids = new Set(pool.map(quoteId))
    for (let n = 0; n < 200; n++) {
      selected = chooseFeaturedSlots(pool, selected, n % 4 === 3 ? null : n % 3)
      expect(new Set(selected.map((i) => quoteId(pool[i]))).size).toBe(3)
      selected.forEach((i) => expect(ids.has(quoteId(pool[i]))).toBe(true))
    }
  })
})
