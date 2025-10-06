import { getPostById } from '@@/server/database/queries/posts'

export default defineEventHandler(async (event) => {
  const { id: portfolioId, postId } = getRouterParams(event)
  const { user } = await requireUserSession(event)
  const post = await getPostById(postId, portfolioId, user.id)
  if (!post) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Post not found',
    })
  }
  return post
})
