import { deletePost } from '@@/server/database/queries/posts'
import { isPortfolioMember } from '@@/server/database/queries/portfolios'

export default defineEventHandler(async (event) => {
  const { id: portfolioId, postId } = getRouterParams(event)
  const { user } = await requireUserSession(event)
  const hasAccess = await isPortfolioMember(portfolioId, user.id)
  if (!hasAccess) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Unauthorized Access',
    })
  }
  const post = await deletePost(postId, portfolioId, user.id)
  return post
})
