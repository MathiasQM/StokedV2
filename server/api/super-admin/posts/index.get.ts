import { getAllPosts } from '@@/server/database/queries/posts'
import { isPortfolioMember } from '~~/server/database/queries/portfolios'
import { findUserById } from '~~/server/database/queries/users'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const hasAccess = await findUserById(user.id)
  if (!hasAccess.superAdmin) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Unauthorized Access',
    })
  }
  const posts = await getAllPosts(user.id)
  return posts
})
