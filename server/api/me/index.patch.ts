import { updateUser } from '@@/server/database/queries/users'
import { validateBody } from '@@/server/utils/bodyValidation'
import { updateUserSchema } from '@@/shared/validations/user'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const body = await validateBody(event, updateUserSchema)

  // strip out undefined values
  const data = Object.fromEntries(
    Object.entries(body).filter(([, v]) => v !== undefined),
  )

  if (Object.keys(data).length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No fields to update',
    })
  }

  const updatedUser = await updateUser(user.id, data)
  const sanitizedUser = sanitizeUser(updatedUser)
  await setUserSession(event, { user: sanitizedUser })
  return sanitizedUser
})
