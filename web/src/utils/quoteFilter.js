// Filter presentation only: retain the original transcript and audio metadata.
const SOUND_ONLY =
  /^[啊阿呀哇哎唉欸诶哟呦噢哦喔嗷呜呃呐呸哈嘿呵哼嗯唔咿嘻咳啧嘘嚯吼嗨嗬呼]+$/u
const SOUND_CAPTION =
  /^(?:笑|大笑|笑声|轻笑|狂笑|喘息|喘气|呻吟|死亡呻吟|受伤呻吟|低吟|低吼|怒吼|怪叫|尖叫|大喊|轻喊|哼唱|哼歌|语气|攻击语气|死亡语气|音频|无台词|无语音|空白|沉默|laughs?|laughing|grunts?|groans?|screams?|sighs?)$/iu
const ENGLISH_SOUND = /^(?:ha+|heh+|h[mu]+|gr+|ugh+|ah+|oh+|ooh+|huh+|eh+)+$/iu

export function hasSpokenText(text) {
  if (typeof text !== 'string') return false
  let spoken = text
    .normalize('NFKC')
    .trim()
    .replace(/_\d+\s*$/u, '')
  // Remove annotations for classification, including nested stage directions.
  let previous
  do {
    previous = spoken
    spoken = spoken.replace(/\([^()]*\)|【[^【】]*】|\[[^\[\]]*\]/gu, '')
  } while (spoken !== previous)
  const words = spoken.replace(/[^\p{L}\p{N}]/gu, '')
  return (
    Boolean(words) &&
    !SOUND_ONLY.test(words) &&
    !SOUND_CAPTION.test(words) &&
    !ENGLISH_SOUND.test(words)
  )
}
