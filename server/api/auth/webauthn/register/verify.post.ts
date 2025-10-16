import { verifyRegistrationResponse } from '@simplewebauthn/server'
import { createCredential } from '@@/server/database/queries/passkeys'
import { createUserWithPasskey } from '@@/server/database/queries/users'
import { sanitizeUser } from '@@/server/utils/auth'
import type { InsertPasskey } from '@@/types/database'
import { readGeoFromIp } from '~~/server/utils/ip'

export default defineEventHandler(async (event) => {
  const { attestation, email } = await readBody(event)
  const config = useRuntimeConfig(event)

  const session = await useSession(event, { password: config.session.password })
  const { challenge: expectedChallenge, userIDString: userID } =
    session.data?.webAuthnChallenge ?? {}

  if (!expectedChallenge || !userID) {
    throw createError({
      statusCode: 400,
      message: 'Your registration session has expired. Please try again.',
    })
  }

  let verification
  try {
    verification = await verifyRegistrationResponse({
      response: attestation,
      expectedChallenge,
      expectedOrigin: config.public.webauthn.origin,
      expectedRPID: config.public.webauthn.rpID,
      requireUserVerification: true,
    })
  } catch (error: any) {
    console.error('💥 WebAuthn Verification Failed:', error)
    throw createError({ statusCode: 400, message: error.message })
  }

  const { verified, registrationInfo } = verification

  if (verified && registrationInfo) {
    const { id, publicKey, counter } = registrationInfo.credential

    if (!email) {
      throw createError({
        statusCode: 400,
        message: 'User identifier missing from response.',
      })
    }
    const geo = await readGeoFromIp(event)

    const newUser = await createUserWithPasskey({
      id: userID,
      email: email.trim().toLowerCase(),
      name: email.split('@')[0],
      emailVerified: true,
      country: geo.country,
      timezone: geo.timezone,
      currency: geo.currency,
    })

    if (!newUser) {
      throw createError({
        statusCode: 500,
        message: 'Failed to create user account.',
      })
    }

    function toBase64Url(data: Uint8Array): string {
      return Buffer.from(data)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')
    }

    const passkey: InsertPasskey = {
      id: id,
      userId: newUser.id,
      publicKey: toBase64Url(publicKey),
      counter: counter,
      name: 'Initial Passkey',
      backedUp: registrationInfo.credentialBackedUp || false,
      transports: attestation.response.transports ?? [],
    }

    await createCredential(passkey)

    const transformedUser = sanitizeUser(newUser)
    await session.update({ webAuthnChallenge: undefined })
    await setUserSession(event, { user: transformedUser })

    return { ok: true, user: transformedUser }
  }

  throw createError({
    statusCode: 400,
    message: 'Passkey verification failed.',
  })
})
