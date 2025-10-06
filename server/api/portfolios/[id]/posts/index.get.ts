import { getAllPosts } from '@@/server/database/queries/posts'
import { isPortfolioMember } from '@@/server/database/queries/portfolios'

export default defineEventHandler(async (event) => {
  const { id: portfolioId } = getRouterParams(event)
  const { user } = await requireUserSession(event)
  const hasAccess = await isPortfolioMember(portfolioId, user.id)
  if (!hasAccess) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Unauthorized Access',
    })
  }
  const posts = await getAllPosts(portfolioId)
  return posts
})
