import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import HeroSection from '../HeroSection'

afterEach(cleanup)
const pool = Array.from({ length: 5 }, (_, i) => ({
  text: 'Curated ' + i,
  championName: 'Hero ' + i,
  championAlias: 'hero' + i,
  skin: 'Default',
  sources: [{ url: 'https://bbs.hupu.com/623685488.html', title: '玩家讨论' }],
}))
describe('recommendation card controls', () => {
  it('provides one shuffle per card and a separate shuffle-all without autoplay', () => {
    const onShuffle = vi.fn(),
      onPlay = vi.fn()
    render(
      <HeroSection
        quotes={pool}
        indices={[0, 1, 2]}
        championCount={5}
        quoteCount={100}
        onShuffle={onShuffle}
        onPlay={onPlay}
      />,
    )
    expect(screen.getByRole('heading', { name: '推荐台词' })).toBeTruthy()
    expect(screen.queryByText('听见符文之地')).toBeNull()
    expect(screen.getAllByText('换一条')).toHaveLength(3)
    for (let slot = 0; slot < 3; slot++) {
      fireEvent.click(
        screen.getByRole('button', { name: '更换第' + (slot + 1) + '条推荐' }),
      )
      expect(onShuffle).toHaveBeenLastCalledWith(slot)
    }
    fireEvent.click(screen.getByRole('button', { name: '更换全部推荐' }))
    expect(onShuffle).toHaveBeenLastCalledWith()
    expect(onPlay).not.toHaveBeenCalled()
    expect(screen.queryByRole('link', { name: '推荐来源' })).toBeNull()
    expect(screen.queryByText('编辑精选')).toBeNull()
    expect(screen.queryByText('玩家推荐')).toBeNull()
  })
})
