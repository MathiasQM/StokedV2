import { verifyAuthenticationResponse } from '@simplewebauthn/server'
import type { AuthenticationResponseJSON } from '@simplewebauthn/server/dist/esm/types'
import {
  findCredentialById,
  updateCredentialCounter,
} from '@@/server/database/queries/passkeys'
import {
  findUserById,
  updateLastActiveTimestamp,
} from '@@/server/database/queries/users'
import { sanitizeUser, sendLoginNotification } from '@@/server/utils/auth'

export default defineEventHandler(async (event) => {
  const body: AuthenticationResponseJSON = await readBody(event)
  const config = useRuntimeConfig(event)

  const session = await useSession(event, { password: config.session.password })
  const expectedChallenge = session.data?.webAuthnChallenge as string

  if (!expectedChallenge) {
    throw createError({
      statusCode: 400,
      message: 'Challenge not found in session or has expired.',
    })
  }

  const credential = await findCredentialById(body.id)
  if (!credential) {
    throw createError({ statusCode: 404, message: 'Passkey not registered.' })
  }

  const credentialForVerification = {
    ...credential,
    publicKey: Buffer.from(credential.publicKey, 'base64url'),
    transports: credential.transports?.split(','),
  }

  let verification
  try {
    verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: config.public.webauthn.origin,
      expectedRPID: config.public.webauthn.rpID,
      requireUserVerification: true,
      credential: credentialForVerification,
    })
  } catch (error: any) {
    console.error('WebAuthn Verification Error:', error)
    throw createError({
      statusCode: 400,
      message:
        'Could not verify the passkey. It may not be compatible or registered correctly.',
    })
  }

  const { verified, authenticationInfo } = verification

  if (verified) {
    await updateCredentialCounter(credential.id, authenticationInfo.newCounter)

    await session.update({ webAuthnChallenge: undefined })

    const user = await findUserById(credential.userId)
    if (!user) {
      throw createError({
        statusCode: 404,
        message: 'User associated with passkey not found.',
      })
    }

    await updateLastActiveTimestamp(user.id)
    const transformedUser = sanitizeUser(user)
    await setUserSession(event, { user: transformedUser })

    await sendLoginNotification({ name: user.name, email: user.email })

    return { ok: true, user: transformedUser }
  }

  throw createError({
    statusCode: 400,
    message: 'Login failed. Could not verify the passkey signature.',
  })
})
