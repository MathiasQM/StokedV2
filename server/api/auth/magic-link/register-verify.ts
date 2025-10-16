import { validateBody } from '@@/server/utils/bodyValidation'
import { otpLoginSchema } from '@@/shared/validations/auth'
import {
  createUserWithOTP,
  updateLastActiveTimestamp,
} from '@@/server/database/queries/users'
import { sanitizeUser } from '@@/server/utils/auth'
import {
  findOneTimePassword,
  deleteOneTimePassword,
} from '@@/server/database/queries/auth'
import { readGeoFromHeaders } from '@@/server/utils/request-geo'
import { readGeoFromIp } from '~~/server/utils/ip'

export default defineEventHandler(async (event) => {
  console.log('register-verify called', event)
  const data = await validateBody(event, otpLoginSchema)

  const oneTimePassword = await findOneTimePassword(data.code)
  if (!oneTimePassword) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid code',
    })
  }
  if (!isWithinExpiryDate(oneTimePassword.expiresAt.getTime())) {
    throw createError({ statusCode: 400, statusMessage: 'OTP has expired' })
  }

  await deleteOneTimePassword(data.code)
  const geo = await readGeoFromIp(event)

  const newUser = await createUserWithOTP({
    email: data.email.trim().toLowerCase(),
    name: data.email.split('@')[0],
    emailVerified: true,
    country: geo.country,
    timezone: geo.timezone,
    currency: geo.currency,
  })

  if (!newUser) {
    throw createError({
      statusCode: 500,
      message: 'Failed to create your account.',
    })
  }

  // Log the new user in
  await updateLastActiveTimestamp(newUser.id)
  await setUserSession(event, { user: sanitizeUser(newUser) })
  await sendLoginNotification({
    name: newUser.name,
    email: newUser.email,
  })

  return sanitizeUser(newUser)
})
