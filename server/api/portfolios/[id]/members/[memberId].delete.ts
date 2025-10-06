import { validatePortfolioOwnership } from '@@/server/utils/portfolioValidation.ts'
import {
  deletePortfolioMember,
  getActivePortfolioMembers,
} from '~~/server/database/queries/portfolios'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const portfolioId = getRouterParam(event, 'id')
  const memberId = getRouterParam(event, 'memberId')

  if (!portfolioId || !memberId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Portfolio ID and member ID are required',
    })
  }

  // Validate portfolio ownership and get portfolio details
  await validatePortfolioOwnership(event, portfolioId)

  // Get member details to check role
  const members = await getActivePortfolioMembers(portfolioId)
  const memberToDelete = members.find((member) => member.id === memberId)

  if (!memberToDelete) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Portfolio member not found',
    })
  }

  // Prevent deletion of portfolio owner
  if (memberToDelete.role === 'owner') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Cannot remove the portfolio owner',
    })
  }

  await deletePortfolioMember(portfolioId, memberId)
  return {
    message: 'Portfolio member deleted successfully',
  }
})
