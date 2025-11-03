import {
  findUserPortfolios,
  syncPortfolioPositions,
} from '~~/server/database/queries/portfolios'

import { validateBody } from '@@/server/utils/bodyValidation'
import { createPositionsSchema } from '~~/shared/validations/portfolio'

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

  // 2. Validate request body
  const body = await readBody(event)
  // const body = await validateBody(event, createPositionsSchema)

  // 3. Get user's portfolios to check ownership
  const userPortfolios = await findUserPortfolios(user.id)
  const portfolio = userPortfolios.find((t) => t.id === portfolioId)

  if (!portfolio) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Portfolio not found',
    })
  }

  // 4. Check if user is the owner
  if (portfolio.role !== 'owner') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Only portfolio owners can update portfolio details',
    })
  }

  // 5. Update portfolio
  const updatedPortfolio = await syncPortfolioPositions(portfolioId, body)

  return updatedPortfolio
})
