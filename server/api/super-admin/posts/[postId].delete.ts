import { deletePost } from '@@/server/database/queries/posts'
import { findUserById } from '~~/server/database/queries/users'

export default defineEventHandler(async (event) => {
  const { postId } = getRouterParams(event)
  const { user } = await requireUserSession(event)
  const hasAccess = await findUserById(user.id)
  if (!hasAccess.superAdmin) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Unauthorized Access',
    })
  }
  const post = await deletePost(postId, user.id)
  return post
})
