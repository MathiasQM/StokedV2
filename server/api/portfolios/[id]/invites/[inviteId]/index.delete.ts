import { validatePortfolioOwnership } from '@@/server/utils/portfolioValidation.ts'
import { cancelInvite } from '~~/server/database/queries/portfolios'

export default defineEventHandler(async (event) => {
  const portfolioId = getRouterParam(event, 'id')
  const inviteId = getRouterParam(event, 'inviteId')
  if (!portfolioId || !inviteId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Portfolio ID and invite ID are required',
    })
  }

  await validatePortfolioOwnership(event, portfolioId)
  await cancelInvite(inviteId)
  return 'Invite cancelled successfully'
})
