import { eq } from 'drizzle-orm'
import { fetchLiveQuotesFromServer } from '@@/server/utils/market'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  const portfolioId = getRouterParam(event, 'id')

  if (!portfolioId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Portfolio ID is required',
    })
  }

  const portfolioPositions = await useDB()
    .select()
    .from(tables.portfolioPositions)
    .where(eq(tables.portfolioPositions.portfolioId, portfolioId))

  console.log('PORTFOLIO POSITIONS', portfolioPositions)

  if (portfolioPositions.length === 0) {
    return [] // Return empty array if no holdings
  }

  return portfolioPositions
})
