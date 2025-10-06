// server/lib/news/normalize.ts
type ProviderItem = {
  title?: string
  content?: string
  symbols?: string[] // e.g. ["AAPL.US","SPX.INDX"]
  tags?: string[]
  date?: string
  link?: string
  pos?: number
  neg?: number
  neu?: number
  polarity?: number
}

export type ArticleItem = {
  title: string
  content: string
  symbols: string[] // e.g. ["AAPL","SPX"]
  sentiment: 'positive' | 'negative' | 'neutral'
  tags: string[]
  date: string // ISO
  link?: string
  // optional numeric score if you want to log/use later
  sentiment_score?: {
    pos?: number
    neg?: number
    neu?: number
    polarity?: number
  }
}

const stripIso = (s?: string) => {
  try {
    return new Date(s!).toISOString()
  } catch {
    return new Date().toISOString()
  }
}

const toBaseSymbol = (s: string) => {
  // "AAPL.US" -> "AAPL"; "SPX.INDX" -> "SPX"
  const [base] = s.split('.')
  return (base || s).toUpperCase()
}

const pickSentiment = (
  pos = 0,
  neg = 0,
): 'positive' | 'negative' | 'neutral' => {
  if (pos > neg) return 'positive'
  if (neg > pos) return 'negative'
  return 'neutral'
}

export function normalizeProviderNews(
  items: ProviderItem[],
  opts?: { ticker?: string; max?: number },
) {
  const out: ArticleItem[] = []

  for (const it of items || []) {
    const title = (it.title || '').trim()
    const content = (it.content || '').trim()
    if (!title && !content) continue

    const symbols = (it.symbols || []).map(toBaseSymbol)
    const sentiment = pickSentiment(it.pos, it.neg)
    const tags = it.tags || []
    const date = stripIso(it.date)
    const link = it.link

    const row: ArticleItem = {
      title,
      content: content.slice(0, 2000), // keep it sane for the LLM
      symbols,
      sentiment,
      tags,
      date,
      link,
      sentiment_score: {
        pos: it.pos,
        neg: it.neg,
        neu: it.neu,
        polarity: it.polarity,
      },
    }
    out.push(row)
  }

  // optional filtering by a chosen ticker
  const filtered = opts?.ticker
    ? out.filter((a) => a.symbols.includes(opts.ticker!.toUpperCase()))
    : out

  // simple de-dupe by title+date
  const seen = new Set<string>()
  const deduped = filtered.filter((a) => {
    const k = `${a.title}::${a.date.slice(0, 10)}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })

  return opts?.max ? deduped.slice(0, opts.max) : deduped
}
