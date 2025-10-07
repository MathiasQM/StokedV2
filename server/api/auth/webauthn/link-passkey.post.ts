// File: server/api/auth/webauthn/link-passkey.post.ts

import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from '@simplewebauthn/server'
import {
  storeWebAuthnChallenge,
  getAndDeleteChallenge,
  createCredential,
} from '@@/server/database/queries/passkeys'
import type { InsertPasskey } from '@@/types/database'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const body = await readBody(event)

  // Security Check: User must be logged in to link a key.
  const { user: sessionUser } = await requireUserSession(event)

  // --- Step 1: Generate and send challenge options ---
  if (!body.response) {
    // Verify the email from the request body matches the session user.
    if (!body.userName || body.userName !== sessionUser.email) {
      throw createError({
        statusCode: 401,
        message: 'Email does not match session.',
      })
    }

    const options = await generateRegistrationOptions({
      rpName: 'Striive',
      rpID: config.public.webauthn.rpID,
      userName: sessionUser.email,
      userDisplayName: body.displayName || sessionUser.email,
      attestationType: 'none',
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        requireResidentKey: true,
        userVerification: 'required',
      },
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

  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge,
    expectedOrigin: config.public.webauthn.origin,
    requireUserVerification: true,
  })

  if (!verification.verified || !verification.registrationInfo) {
    throw createError({
      statusCode: 400,
      message: 'Could not verify passkey registration.',
    })
  }

  // --- Step 3: Link was successful, save the new credential ---
  const { registrationInfo } = verification
  const { credentialID, credentialPublicKey, counter } = registrationInfo

  const passkey: InsertPasskey = {
    id: Buffer.from(credentialID).toString('base64'),
    userId: sessionUser.id, // Use the ID from the active session
    name: body.displayName || 'Unnamed Passkey',
    publicKey: Buffer.from(credentialPublicKey).toString('base64'),
    counter,
    backedUp: response.response.transports?.includes('internal') ?? false,
    transports: response.response.transports?.join(',') ?? '',
  }
  await createCredential(passkey)

  return { ok: true }
})
