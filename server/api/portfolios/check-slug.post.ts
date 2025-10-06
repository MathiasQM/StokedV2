import { checkSlugConflict } from '../../../server/database/queries/portfolios'

export default defineEventHandler(async (event) => {
  const { slug } = await readBody(event)
  const { user } = await requireUserSession(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  return await checkSlugConflict(user.id, slug)
})
