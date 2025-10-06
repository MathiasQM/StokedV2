import { createPost } from '@@/server/database/queries/posts'
import type { InsertPost } from '@@/types/database'
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
  const { title, content, image } = await readBody<InsertPost>(event)
  const payload = {
    title,
    content,
    image,
    portfolioId,
    userId: user.id,
  }
  const post = await createPost(payload)
  return post
})
