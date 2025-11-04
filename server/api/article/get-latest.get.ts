import { H3Event, getQuery, setResponseStatus, sendError } from 'h3'
import { sql, inArray } from 'drizzle-orm'
import type { InferSelectModel } from 'drizzle-orm'

type ArticleRow = InferSelectModel<typeof tables.articles>

function parseTickers(q: Record<string, any>): string[] {
  const raw = q.tickers
  const arr = Array.isArray(raw)
    ? raw
    : typeof raw === 'string'
      ? raw.split(',')
      : []
  return arr.map((s) => String(s).trim().toLowerCase()).filter(Boolean)
}

function safeParseJSON<T = unknown>(v: unknown, fallback: T): T {
  if (v == null) return fallback
  if (typeof v === 'string') {
    try {
      return JSON.parse(v) as T
    } catch {
      return fallback
    }
  }
  if (typeof v === 'object') return v as T
  return fallback
}

export default defineEventHandler(async (event: H3Event) => {
  const query = getQuery(event)
  const tickers = parseTickers(query)

  if (!tickers.length) {
    setResponseStatus(event, 400)
    return sendError(
      event,
      createError({
        statusCode: 400,
        statusMessage:
          'Provide tickers as a comma-separated list, e.g. ?tickers=AAPL,TSLA',
      }),
    )
  }

  if (tickers.length > 50) {
    setResponseStatus(event, 400)
    return sendError(
      event,
      createError({
        statusCode: 400,
        statusMessage: 'Too many tickers (max 50).',
      }),
    )
  }

  try {
    const db = await useDB()

    const rows = await db.execute<ArticleRow>(
      sql`
        SELECT DISTINCT ON (${tables.articles.ticker})
          ${tables.articles}.* 
        FROM ${tables.articles}
        WHERE ${inArray(tables.articles.ticker, tickers)}
        AND ${tables.articles}.ticker IS NOT NULL
        ORDER BY ${tables.articles.ticker}, ${tables.articles.createdAt} DESC
      `,
    )

    const got = new Map<string, ArticleRow>()
    const resultRows = (rows as any).rows ?? rows
    for (const row of resultRows) {
      if (!row?.ticker) continue
      got.set(String(row.ticker).toLowerCase(), row)
    }

    const out = tickers
      .map((t) => {
        const row = got.get(t)
        if (!row?.ticker) return null

        const created_at =
          (row as any).created_at ?? (row as any).createdAt ?? null

        return {
          id: row.id,
          created_at,
          ticker: String(row.ticker).toUpperCase(),
          title: row.title,
          introduction: row.introduction,

          body: safeParseJSON<string[]>(
            row.body,
            Array.isArray(row.body) ? (row.body as any) : [],
          ),

          conclusion: row.conclusion,

          components: safeParseJSON<any[]>(
            row.components,
            Array.isArray(row.components) ? (row.components as any) : [],
          ),
        } as ArticleData
      })
      .filter((a): a is ArticleData => !!a)

    setResponseStatus(event, 200)
    return out
  } catch (err: any) {
    console.error('get-latest error:', err)
    setResponseStatus(event, 500)
    return sendError(
      event,
      createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch articles from database.',
        data: err?.message,
      }),
    )
  }
})
