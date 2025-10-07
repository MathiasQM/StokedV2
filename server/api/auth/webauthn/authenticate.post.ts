// File: server/api/auth/webauthn/authenticate.post.ts

import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server'
import {
  storeWebAuthnChallenge,
  getAndDeleteChallenge,
  findCredentialById,
  updateCredentialCounter,
} from '@@/server/database/queries/passkeys'
import {
  findUserById,
  updateLastActiveTimestamp,
} from '@@/server/database/queries/users'
import { sanitizeUser, sendLoginNotification } from '@@/server/utils/auth'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const body = await readBody(event)

  // --- Step 1: Generate and send challenge options ---
  if (!body.response) {
    const options = await generateAuthenticationOptions({
      rpID: config.public.webauthn.rpID,
      userVerification: 'required',
    })

    await storeWebAuthnChallenge(options.challenge, options.challenge)

    return options
  }

  // --- Step 2: Verify the browser's response ---
  const response = body.response
  const expectedChallenge = await getAndDeleteChallenge(response.id)

  if (!expectedChallenge) {
    throw createError({
      statusCode: 404,
      message: 'Challenge not found or expired.',
    })
  }

  const credential = await findCredentialById(response.id)
  if (!credential) {
    throw createError({ statusCode: 404, message: 'Passkey not registered.' })
  }

  if (credential.revokedAt) {
    throw createError({
      statusCode: 403,
      message: 'This passkey has been revoked.',
    })
  }

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin: config.public.webauthn.origin,
    expectedRPID: config.public.webauthn.rpID,
    authenticator: {
      credentialID: Buffer.from(credential.id, 'base64'),
      credentialPublicKey: Buffer.from(credential.publicKey, 'base64'),
      counter: credential.counter,
      transports: credential.transports?.split(','),
    },
    requireUserVerification: true,
  })

  if (!verification.verified) {
    throw createError({
      statusCode: 401,
      message: 'Could not verify passkey authentication.',
    })
  }

  // --- Step 3: Login was successful, update counter and set session ---
  const { newCounter } = verification.authenticationInfo
  await updateCredentialCounter(credential.id, newCounter)

  const user = await findUserById(credential.userId)
  if (!user) {
    throw createError({ statusCode: 404, message: 'User not found.' })
  }

  await updateLastActiveTimestamp(user.id)
  const transformedUser = sanitizeUser(user)
  await setUserSession(event, { user: transformedUser })

  await sendLoginNotification({ name: user.name, email: user.email })

  return { ok: true }
})
