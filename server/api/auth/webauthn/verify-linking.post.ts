// server/api/passkeys/verify-linking.post.ts

import { verifyRegistrationResponse } from '@simplewebauthn/server'
import type { RegistrationResponseJSON } from '@simplewebauthn/server/dist/esm/types'
import {
  getAndDeleteChallenge,
  createCredential,
} from '@@/server/database/queries/passkeys'
import type { InsertPasskey } from '@@/types/database'

export default defineEventHandler(async (event) => {
  // This endpoint is for logged-in users only
  const { user: sessionUser } = await requireUserSession(event)

  const body: { attestation: RegistrationResponseJSON; name: string } =
    await readBody(event)
  const { attestation, name } = body

  const config = useRuntimeConfig(event)

  // Get and validate the challenge
  const clientData = JSON.parse(
    Buffer.from(attestation.response.clientDataJSON, 'base64').toString('utf8'),
  )
  const storedChallengeData = await getAndDeleteChallenge(clientData.challenge)

  if (!storedChallengeData) {
    throw createError({
      statusCode: 404,
      message: 'Challenge not found or expired.',
    })
  }

  // Verify the registration response
  const { verified, registrationInfo } = await verifyRegistrationResponse({
    response: attestation,
    expectedChallenge: storedChallengeData.challenge,
    expectedOrigin: config.public.webauthn.origin,
    expectedRPID: config.public.webauthn.rpID,
    requireUserVerification: true,
  })

  if (verified && registrationInfo) {
    const {
      id: credentialID,
      publicKey: credentialPublicKey,
      counter,
    } = registrationInfo.credential

    // Create the new passkey and link it to the current user
    const passkey: InsertPasskey = {
      id: Buffer.from(credentialID).toString('base64'),
      userId: sessionUser.id,
      publicKey: Buffer.from(credentialPublicKey),
      counter,
      name: name || 'New Passkey',
      backedUp: registrationInfo.credentialBackedUp,
      transports: registrationInfo.credential.transports ?? [],
    }
    await createCredential(passkey)

    return { ok: true, message: 'New passkey linked successfully.' }
  }

  throw createError({
    statusCode: 400,
    message: 'Passkey verification failed.',
  })
})
