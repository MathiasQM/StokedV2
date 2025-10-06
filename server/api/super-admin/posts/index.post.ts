import { createPost } from '@@/server/database/queries/posts'
import type { InsertPost } from '@@/types/database'
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
  const { title, content, image } = await readBody<InsertPost>(event)
  const payload = {
    title,
    content,
    image,
    userId: user.id,
  }
  const post = await createPost(payload)
  return post
})
