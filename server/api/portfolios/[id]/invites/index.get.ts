import { validatePortfolioOwnership } from '@@/server/utils/portfolioValidation.ts'
import { getPortfolioInvites } from '~~/server/database/queries/portfolios'

export default defineEventHandler(async (event) => {
  const portfolioId = getRouterParam(event, 'id')
  if (!portfolioId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Portfolio ID is required',
    })
  }

  await validatePortfolioOwnership(event, portfolioId)
  const portfolioInvites = await getPortfolioInvites(portfolioId)
  return portfolioInvites
})
