// server/api/auth/webauthn/verify-registration.post.ts

import { verifyRegistrationResponse } from '@simplewebauthn/server'
import type {
  VerifiedRegistrationResponse,
  RegistrationResponseJSON,
} from '@simplewebauthn/server/dist/esm/types'
import {
  getAndDeleteChallenge,
  createCredential,
} from '@@/server/database/queries/passkeys'
import { createUserWithPasskey } from '@@/server/database/queries/users'
import { sanitizeUser } from '@@/server/utils/auth'
import type { InsertPasskey } from '@@/types/database'

export default defineEventHandler(async (event) => {
  const {
    attestation,
    email,
  }: { attestation: RegistrationResponseJSON; email: string } =
    await readBody(event)

  const config = useRuntimeConfig(event)
  const expectedOrigin = config.public.webauthn.origin // Your custom domain
  const expectedRPID = config.public.webauthn.rpID

  const clientData = JSON.parse(
    Buffer.from(attestation.response.clientDataJSON, 'base64').toString('utf8'),
  )
  const challengeFromClient = clientData.challenge

  // 1. Get the challenge we stored earlier
  const expectedChallenge = await getAndDeleteChallenge(challengeFromClient)

  if (!expectedChallenge) {
    throw createError({
      statusCode: 404,
      message: 'Challenge not found or expired.',
    })
  }

  let verification: VerifiedRegistrationResponse
  try {
    // 2. **CRITICAL STEP**: Verify the authenticator response
    // We explicitly pass `expectedOrigin` and `expectedRPID`.
    verification = await verifyRegistrationResponse({
      response: attestation,
      expectedChallenge,
      expectedOrigin,
      expectedRPID,
      requireUserVerification: true,
    })
  } catch (error: any) {
    console.error('WebAuthn verification failed:', error)
    throw createError({ statusCode: 400, message: error.message })
  }

  const { verified, registrationInfo } = verification

  if (verified && registrationInfo) {
    console.log('Inspecting registrationInfo:', registrationInfo)

    // ✅ STEP 2: Use the correct property names to destructure
    const { id, publicKey, counter } = registrationInfo.credential

    if (!email) {
      throw createError({
        statusCode: 400,
        message: 'User identifier missing from response.',
      })
    }

    // 3. Create the user in the database
    const newUser = await createUserWithPasskey({
      email,
      name: email.split('@')[0],
      emailVerified: true,
    })

    if (!newUser) {
      throw createError({
        statusCode: 500,
        message: 'Failed to create user account.',
      })
    }

    // 4. Create the passkey credential linked to the new user
    function toBase64Url(data: Uint8Array): string {
      return Buffer.from(data)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')
    }

    // ... inside your registration logic
    const passkey: InsertPasskey = {
      // id is already Base64URL, use it directly.
      id: id,
      userId: newUser.id,
      // Correctly encode the publicKey Uint8Array to Base64URL.
      publicKey: toBase64Url(publicKey),
      counter: counter,
      name: 'Initial Passkey',
      backedUp: registrationInfo.credentialBackedUp || false,
      // The transports array will be handled by Drizzle/Postgres
      transports: attestation.response.transports ?? [],
    }

    console.log('SAVING NEW PASSKEY:', passkey)

    await createCredential(passkey)

    // 5. Log the user in
    const transformedUser = sanitizeUser(newUser)
    await setUserSession(event, { user: transformedUser })

    return { ok: true, user: transformedUser }
  }

  throw createError({
    statusCode: 400,
    message: 'Passkey verification failed.',
  })
})
