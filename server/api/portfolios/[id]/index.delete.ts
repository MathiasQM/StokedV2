import {
  deletePortfolio,
  findUserPortfolios,
} from '~~/server/database/queries/portfolios'

export default defineEventHandler(async (event) => {
  // 1. Get authenticated user and portfolio ID
  const { user } = await requireUserSession(event)
  const portfolioId = getRouterParam(event, 'id')

  if (!portfolioId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Portfolio ID is required',
    })
  }

  // 2. Get user's portfolios to check ownership
  const userPortfolios = await findUserPortfolios(user.id)
  const portfolio = userPortfolios.find((t) => t.id === portfolioId)

  if (!portfolio) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Portfolio not found',
    })
  }

  // 3. Check if user is the owner
  if (portfolio.role !== 'owner') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Only portfolio owners can delete portfolios',
    })
  }

  // 4. Delete the portfolio
  await deletePortfolio(portfolioId)

  return {
    message: 'Portfolio deleted successfully',
  }
})
