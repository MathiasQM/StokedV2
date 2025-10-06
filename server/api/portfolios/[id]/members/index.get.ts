import { validatePortfolioOwnership } from '@@/server/utils/portfolioValidation.ts'
import { getActivePortfolioMembers } from '~~/server/database/queries/portfolios'

export default defineEventHandler(async (event) => {
  const portfolioId = getRouterParam(event, 'id')
  if (!portfolioId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Portfolio ID is required',
    })
  }

  await validatePortfolioOwnership(event, portfolioId)
  const portfolioMembers = await getActivePortfolioMembers(portfolioId)
  return portfolioMembers
})
