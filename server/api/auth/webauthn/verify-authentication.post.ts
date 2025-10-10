// server/api/auth/passkeys/verify-authentication.post.ts

import { verifyAuthenticationResponse } from '@simplewebauthn/server'
import type { AuthenticationResponseJSON } from '@simplewebauthn/server/dist/esm/types'
import {
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
  const body: AuthenticationResponseJSON = await readBody(event)
  const config = useRuntimeConfig(event)
  console.log('Received body from client:', JSON.stringify(body, null, 2))

  // --- 🔒 CRITICAL SECURITY FIX ---
  // 1. Get the expected challenge from the secure session, not the request body.
  const session = await useSession(event, { password: config.session.password })
  const expectedChallenge = session.data?.webAuthnChallenge as string

  if (!expectedChallenge) {
    throw createError({
      statusCode: 400,
      message: 'Challenge not found in session or has expired.',
    })
  }

  const credential = await findCredentialById(body.id)
  console.log('Found credential:', credential)
  if (!credential) {
    throw createError({ statusCode: 404, message: 'Passkey not registered.' })
  }

  const authenticatorDetails = {
    credentialID: Buffer.from(credential.id, 'base64url'),
    credentialPublicKey: Buffer.from(credential.publicKey, 'base64url'),
    counter: Number(credential.counter),
    expectedTransports: credential.transports.split(','),
  }

  const credentialForVerification = {
    ...credential,
    // ✅ FIX: Convert the publicKey string to a Buffer
    publicKey: Buffer.from(credential.publicKey, 'base64url'),
    // Also ensure transports is an array if it's a string
    transports: credential.transports.split(','),
  }

  let verification
  try {
    verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: config.public.webauthn.origin,
      expectedRPID: config.public.webauthn.rpID,
      requireUserVerification: true,
      // ✅ FINAL FIX: Pass the entire credential object from your database
      credential: credentialForVerification,
    })
  } catch (error: any) {
    throw createError({ statusCode: 400, message: error.message })
  }

  const { verified, authenticationInfo } = verification

  if (verified) {
    // 4. Verification successful, update the counter and log the user in.
    await updateCredentialCounter(credential.id, authenticationInfo.newCounter)

    // Clear the single-use challenge from the session.
    await session.update({ webAuthnChallenge: undefined })

    const user = await findUserById(credential.userId)
    if (!user) {
      // This is an unlikely edge case but good to handle.
      throw createError({
        statusCode: 404,
        message: 'User associated with passkey not found.',
      })
    }

    await updateLastActiveTimestamp(user.id)
    const transformedUser = sanitizeUser(user)
    await setUserSession(event, { user: transformedUser })

    // Optional: Send a notification about the new login.
    await sendLoginNotification({ name: user.name, email: user.email })

    return { ok: true, user: transformedUser }
  }

  // 5. If verification fails, throw an error.
  throw createError({
    statusCode: 400,
    message: 'Login failed. Could not verify passkey.',
  })
})
