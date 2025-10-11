import { generateRegistrationOptions } from '@simplewebauthn/server'
import { findUserByEmail } from '@@/server/database/queries/users'
import { storeWebAuthnChallenge } from '@@/server/database/queries/passkeys'
import { emailSchema } from '@@/shared/validations/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email } = body

  const validation = emailSchema.safeParse({ email })
  if (!validation.success) {
    throw createError({ statusCode: 400, message: 'Invalid email format.' })
  }

  const existingUser = await findUserByEmail(validation.data.email)
  if (
    existingUser?.banned &&
    existingUser?.bannedUntil &&
    existingUser?.bannedUntil > new Date()
  ) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Your account has been banned',
    })
  }

  if (existingUser) {
    throw createError({
      statusCode: 409,
      message: 'An account with this email already exists.',
    })
  }

  const config = useRuntimeConfig(event)
  const rpID = config.public.webauthn.rpID
  const rpName = 'Striive'
  const userIDString = crypto.randomUUID()
  const userID = new TextEncoder().encode(userIDString)

  const options = await generateRegistrationOptions({
    rpID,
    rpName,
    userID,
    userName: email,
    attestationType: 'none',
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      requireResidentKey: true,
      userVerification: 'required',
    },
  })

  const session = await useSession(event, { password: config.session.password })
  await session.update({
    webAuthnChallenge: {
      challenge: options.challenge,
      userIDString,
    },
  })

  return options
})
