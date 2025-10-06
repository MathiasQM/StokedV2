// server/lib/sync/heuristic.ts
/**
 * Roughly assign times without word timestamps:
 * distribute section/sentence times by character length across total audio duration.
 */
export function heuristicIndex(script: any, totalDurationSec: number) {
  // total chars
  const sections = script.script.sections
  const allText = sections.map((s: any) => s.text).join('')
  const totalChars = Math.max(1, allText.length)

  let cursor = 0
  const sectionTimes: any = {}
  const sentenceTimes: any = {}
  const wordTimes: any = {} // not available; leave empty

  for (const sec of sections) {
    const secChars = Math.max(1, sec.text.length)
    const secDur = (secChars / totalChars) * totalDurationSec
    const secStart = cursor
    const secEnd = cursor + secDur
    sectionTimes[sec.id] = { start: secStart, end: secEnd }

    // distribute sentence bounds inside section
    const sentTotal = Math.max(
      1,
      (sec.sentences || []).reduce((n: any, s: any) => n + s.text.length, 0),
    )
    let sCursor = secStart
    for (const sent of sec.sentences || []) {
      const len = Math.max(1, sent.text.length)
      const dur = (len / sentTotal) * secDur
      sentenceTimes[sent.id] = { start: sCursor, end: sCursor + dur }
      sCursor += dur
    }
    cursor += secDur
  }

  return { wordTimes, sentenceTimes, sectionTimes, tokensBySecWord: {} }
}
