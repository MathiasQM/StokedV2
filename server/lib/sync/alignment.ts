// server/lib/sync/alignment.ts
const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}%.$-]+/gu, '')
    .trim()

type TokenRef = { id: string; text: string }
type SentenceRef = { id: string; text: string; tokens: TokenRef[] }
type SectionRef = { id: string; text: string; sentences: SentenceRef[] }

type ScriptJson = {
  script: { words: number; sections: SectionRef[] }
  render_cues: any[]
}

type WordTiming = { text: string; start: number; end: number }

export function buildAlignmentIndex(script: ScriptJson, words: WordTiming[]) {
  // 1) Flatten tokens from the structured script
  const flatTokens: { id: string; text: string; sec: string; sent: string }[] =
    []

  for (const sec of script.script.sections || []) {
    for (const s of sec.sentences || []) {
      for (const t of s.tokens || []) {
        flatTokens.push({ id: t.id, text: t.text, sec: sec.id, sent: s.id })
      }
    }
  }

  // 2) Map tokens -> word timings by greedy text match (normalized)
  const wordTimes: Record<string, { start: number; end: number }> = {}
  let wi = 0
  const N = words.length

  for (const tk of flatTokens) {
    const want = norm(tk.text)
    while (wi < N && norm(words[wi].text) !== want) wi++
    if (wi < N) {
      wordTimes[tk.id] = { start: words[wi].start, end: words[wi].end }
      wi++
    }
  }

  // 3) Gather token ids by sentence and section (FIXED: no chained push)
  const bySentence: Record<string, string[]> = {}
  const bySection: Record<string, string[]> = {}

  for (const tk of flatTokens) {
    ;(bySentence[tk.sent] ||= []).push(tk.id)
    ;(bySection[tk.sec] ||= []).push(tk.id)
  }

  // 4) Compute bounds for each sentence/section from token timings
  const bounds = (ids: string[]) => {
    const ts = ids.map((id) => wordTimes[id]).filter(Boolean)
    if (!ts.length) return null
    return {
      start: Math.min(...ts.map((t) => t.start)),
      end: Math.max(...ts.map((t) => t.end)),
    }
  }

  const sentenceTimes: Record<string, { start: number; end: number }> = {}
  for (const [sid, ids] of Object.entries(bySentence)) {
    const b = bounds(ids)
    if (b) sentenceTimes[sid] = b
  }

  const sectionTimes: Record<string, { start: number; end: number }> = {}
  for (const [sec, ids] of Object.entries(bySection)) {
    const b = bounds(ids)
    if (b) sectionTimes[sec] = b
  }

  // 5) For "match" triggers: section → normalized token text → token ids
  const tokensBySecWord: Record<string, Record<string, string[]>> = {}
  for (const tk of flatTokens) {
    const bag = (tokensBySecWord[tk.sec] ||= {})
    ;(bag[norm(tk.text)] ||= []).push(tk.id)
  }

  return { wordTimes, sentenceTimes, sectionTimes, tokensBySecWord }
}

export function resolveTrigger(idx: any, trig: any): number | null {
  if (trig.type === 'section') {
    const s = idx.sectionTimes[trig.id]
    return s ? (trig.at === 'end' ? s.end : s.start) : null
  }
  if (trig.type === 'sentence') {
    const s = idx.sentenceTimes[trig.id]
    return s ? (trig.at === 'end' ? s.end : s.start) : null
  }
  if (trig.type === 'word') {
    return idx.wordTimes[trig.id]?.start ?? null
  }
  if (trig.type === 'match') {
    const ids = idx.tokensBySecWord[trig.scope]?.[norm(trig.query)] || []
    const i = Math.max(0, (trig.occurrence ?? 1) - 1)
    return idx.wordTimes[ids[i]]?.start ?? null
  }
  return null
}

export function materializeCues(script: ScriptJson, idx: any) {
  const out: { at: number; components: any[] }[] = []
  for (const cue of script.render_cues || []) {
    const at = resolveTrigger(idx, cue.trigger)
    if (at != null) out.push({ at, components: cue.components })
  }
  out.sort((a, b) => a.at - b.at)
  return out
}
