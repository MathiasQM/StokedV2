// server/utils/portfolioValidation.ts
import { H3Event } from 'h3'
import { findUserPortfolios } from '~~/server/database/queries/portfolios'

export async function validatePortfolioOwnership(
  event: H3Event,
  portfolioId: string,
) {
  // 1. Get authenticated user
  const { user } = await requireUserSession(event)

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
      statusMessage: 'Only portfolio owners can perform this action',
    })
  }

  return { user, portfolio }
}
