import { H3Event, getQuery, setResponseStatus, sendError } from 'h3'
import { eq, desc } from 'drizzle-orm'

export default defineEventHandler(async (event: H3Event) => {
  const query = getQuery(event)
  const ticker = query.ticker as string | undefined

  if (!ticker || typeof ticker !== 'string') {
    setResponseStatus(event, 400)
    return sendError(
      event,
      createError({
        statusCode: 400,
        statusMessage:
          'Ticker query parameter is required and must be a string.',
      }),
    )
  }

  try {
    const result = await useDB()
      .select()
      .from(tables.articles)
      .where(eq(tables.articles.ticker, ticker.toLowerCase()))
      .orderBy(desc(tables.articles.createdAt))
      .limit(1)

    if (!result || result.length === 0) {
      setResponseStatus(event, 404)
      return null
    }

    const latestArticle = result[0]
    setResponseStatus(event, 200)
    return latestArticle
  } catch (err: any) {
    console.error('Database query or server error:', err)
    setResponseStatus(event, 500)
    return sendError(
      event,
      createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch article from database.',
        data: err.message,
      }),
    )
  }
})
