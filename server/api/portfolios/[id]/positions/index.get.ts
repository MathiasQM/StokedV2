import { eq } from 'drizzle-orm'
import { fetchLiveQuotesFromServer } from '@@/server/utils/market'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const portfolioId = getRouterParam(event, 'id')

  if (!portfolioId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Portfolio ID is required',
    })
  }

  // 1. Fetch all positions for this portfolio from the DB
  // RLS policies will ensure the user can only access their own portfolios.
  const dbPositions = await useDB()
    .select()
    .from(tables.portfolioPositions)
    .where(eq(tables.portfolioPositions.portfolioId, portfolioId))

  if (dbPositions.length === 0) {
    return [] // Return empty array if no holdings
  }

  // 2. Get unique symbols to fetch live data
  const symbols = [...new Set(dbPositions.map((p) => p.symbol))]
  const liveQuotes = await fetchLiveQuotesFromServer(symbols)

  // 3. Combine DB data with live data and calculate values
  const holdings = dbPositions.map((pos) => {
    const liveData = liveQuotes[pos.symbol]

    if (!liveData || typeof liveData.close !== 'number') {
      // Handle cases where live data might not be available
      return { ...pos, value: 0, return: 0, today: 0, latest: 0 }
    }

    const latestPrice = liveData.close
    const currentValue = pos.shares * latestPrice
    const costBasis = pos.shares * pos.cost_per_share

    const totalReturn =
      costBasis > 0 ? ((currentValue - costBasis) / costBasis) * 100 : 0
    const todayChange = liveData.change_p ?? 0

    return {
      id: pos.id,
      name: pos.name,
      symbol: pos.symbol,
      value: currentValue,
      return: totalReturn,
      today: todayChange,
      latest: latestPrice,
      website: pos.website,
    }
  })

  return holdings
})
