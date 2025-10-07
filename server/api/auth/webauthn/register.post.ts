// File: server/api/auth/webauthn/register.post.ts

import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from '@simplewebauthn/server'
import {
  storeWebAuthnChallenge,
  getAndDeleteChallenge,
  createCredential,
} from '@@/server/database/queries/passkeys'
import { findUserByEmail, createUser } from '@@/server/database/queries/users'
import type { InsertPasskey } from '@@/types/database'
import { emailSchema } from '@@/shared/validations/auth'
import { sanitizeUser } from '@@/server/utils/auth'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const body = await readBody(event)

  // --- Step 1: Generate and send challenge options ---
  if (!body.response) {
    const { email } = emailSchema.parse({ email: body.userName })

    const existingUser = await findUserByEmail(email)
    if (existingUser) {
      throw createError({
        statusCode: 409,
        message: 'An account with this email already exists.',
      })
    }

    const options = await generateRegistrationOptions({
      rpName: 'Striive',
      rpID: config.public.webauthn.rpID,
      userName: email,
      userDisplayName: email,
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
    expectedOrigin: config.public.webauthn.origin, // <-- This is the critical line
    requireUserVerification: true,
  })

  if (!verification.verified || !verification.registrationInfo) {
    throw createError({
      statusCode: 400,
      message: 'Could not verify passkey registration.',
    })
  }

  const { registrationInfo } = verification
  const { credentialID, credentialPublicKey, counter } = registrationInfo

  // --- Step 3: Create user and save credential (onSuccess logic) ---
  const newUser = await createUser({
    email: body.userName,
    name: body.userName.split('@')[0],
    emailVerified: true,
  })

  if (!newUser) {
    throw createError({
      statusCode: 500,
      message: 'Failed to create user account.',
    })
  }

  const passkey: InsertPasskey = {
    id: Buffer.from(credentialID).toString('base64'),
    userId: newUser.id,
    name: 'Initial Passkey',
    publicKey: Buffer.from(credentialPublicKey).toString('base64'),
    counter,
    backedUp: response.response.transports?.includes('internal') ?? false,
    transports: response.response.transports?.join(',') ?? '',
  }
  await createCredential(passkey)

  const transformedUser = sanitizeUser(newUser)
  await setUserSession(event, { user: transformedUser })

  return { ok: true }
})
