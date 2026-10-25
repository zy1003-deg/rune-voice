import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import ChampionDetail from '../ChampionDetail'

afterEach(cleanup)
const quotes = [
  {
    text: 'shared selection',
    skin: '默认皮肤',
    event: '选人',
    dir: 'hero',
    file: 'shared.mp3',
  },
  {
    text: 'special move',
    skin: 'Special',
    event: '移动',
    dir: 'hero/Special',
    file: 's.mp3',
  },
  {
    text: 'default move',
    skin: 'Hero 默认皮肤',
    event: '移动',
    dir: 'hero/Default',
    file: 'd.mp3',
  },
].map((q) => ({ ...q, championName: 'Hero', championAlias: 'hero' }))
const props = {
  champion: { name: 'Hero', alias: 'hero' },
  quotes,
  state: 'ready',
  search: '',
  onPlay: vi.fn(),
  onBack: vi.fn(),
  onFavorite: vi.fn(),
  savedIds: new Set(),
}

describe('hero browsing and playback filters', () => {
  it('defaults to the base skin and retains shared selection in every skin', () => {
    render(<ChampionDetail {...props} />)
    expect(screen.getByRole('combobox').value).toBe('Hero 默认皮肤')
    expect(screen.getByText('shared selection')).toBeTruthy()
    expect(screen.queryByText('special move')).toBeNull()
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'Special' },
    })
    expect(screen.getByText('shared selection')).toBeTruthy()
    expect(screen.getByText('special move')).toBeTruthy()
    expect(screen.queryByText('default move')).toBeNull()
  })
  it('plays only the currently selected event and search matches', () => {
    const onPlay = vi.fn()
    const { rerender } = render(<ChampionDetail {...props} onPlay={onPlay} />)
    fireEvent.click(screen.getByRole('button', { name: '移动 1' }))
    fireEvent.click(screen.getByRole('button', { name: '播放当前列表' }))
    expect(onPlay.mock.calls[0][1].map((q) => q.text)).toEqual(['default move'])
    rerender(<ChampionDetail {...props} search="shared" onPlay={onPlay} />)
    expect(screen.getByText('shared')).toBeTruthy()
    expect(screen.queryByText('default move')).toBeNull()
  })
  it('removes sounds from rendered rows, categories and the playback list while retaining short dialogue', () => {
    const onPlay = vi.fn()
    const extra = [
      { text: '（奇亚娜 大笑）_2', event: '大笑' },
      { text: '（奇亚娜 攻击语气）', event: '使用' },
      { text: '啊，嗯，哼！', event: '移动' },
      { text: '跪下。', event: '攻击' },
    ].map((q) => ({
      ...q,
      skin: 'Hero 默认皮肤',
      championName: 'Hero',
      dir: 'hero',
      file: q.text + '.mp3',
    }))
    render(
      <ChampionDetail
        {...props}
        quotes={[...quotes, ...extra]}
        onPlay={onPlay}
      />,
    )
    expect(screen.queryByText('（奇亚娜 大笑）_2')).toBeNull()
    expect(screen.queryByText('（奇亚娜 攻击语气）')).toBeNull()
    expect(screen.queryByText('啊，嗯，哼！')).toBeNull()
    expect(screen.getByText('跪下。')).toBeTruthy()
    expect(screen.queryByRole('heading', { name: /^互动/ })).toBeNull()
    expect(screen.queryByRole('heading', { name: /^技能/ })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '播放当前列表' }))
    expect(onPlay.mock.calls[0][1].map((q) => q.text)).toEqual([
      'shared selection',
      'default move',
      '跪下。',
    ])
  })
})
