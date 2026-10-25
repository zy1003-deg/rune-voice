import { describe, expect, it } from 'vitest'
import { hasSpokenText } from '../quoteFilter'

describe('spoken dialogue filtering', () => {
  it.each([
    '',
    null,
    undefined,
    '……',
    '！！！',
    '（奇亚娜 大笑）',
    '（奇亚娜 大笑）_2',
    '（奇亚娜 攻击语气）',
    '（奇亚娜 死亡呻吟）_3',
    '(Qiyana grunts)_2',
    '【喘息】',
    '（（大笑））',
    '（音频）_4',
    '大笑',
    '呻吟',
    '啊！',
    '啊啊啊！_2',
    '嗯……',
    '哼！',
    '啊，哈，呵呵！',
    'Ha ha ha!',
    'Hmm...',
  ])('hides non-dialogue %s', (text) => {
    expect(hasSpokenText(text)).toBe(false)
  })

  it.each([
    '跪下。',
    '山崩地裂。',
    '坚如磐石。',
    '人在塔在。',
    '快快变大！',
    '好。',
    '是。',
    '不。',
    '啊，瞧瞧你。',
    '嗯，今天该怎么做呢？',
    '哼，他们总说我很冷酷。',
    '哈，真有意思！',
    '如果他们想要崇拜我，哼，我不会阻拦。',
    '（怪叫）回去。',
    '（笑）你太天真了。',
    '（低声）不要放弃。',
    'Default move',
    'A quiet arc of light.',
  ])('retains spoken meaning, including short lines: %s', (text) => {
    expect(hasSpokenText(text)).toBe(true)
  })
})
