import { generateRegistrationOptions } from '@simplewebauthn/server'

export default defineEventHandler(async (event) => {
  // 1. Ensure a user is already logged in
  const { user } = await requireUserSession(event)
  const { displayName } = await readBody(event) // Name for the new key, e.g., "My MacBook"

  if (!displayName) {
    throw createError({ statusCode: 400, message: 'Passkey name is required.' })
  }

  const config = useRuntimeConfig(event)
  const userID = new TextEncoder().encode(user.id)

  const options = await generateRegistrationOptions({
    rpID: config.public.webauthn.rpID,
    rpName: 'Striive',
    userID: userID,
    userName: user.email,
    userDisplayName: user.name,
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'required',
      requireResidentKey: true,
    },
  })

  await useSession(event, { password: config.session.password }).then(
    (session) =>
      session.update({
        webAuthnLinkingData: {
          challenge: options.challenge,
          passkeyName: displayName,
        },
      }),
  )

  return options
})
