import { verifyRegistrationResponse } from '@simplewebauthn/server'
import { createCredential } from '@@/server/database/queries/passkeys'
import type { InsertPasskey } from '@@/types/database'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const attestation = await readBody(event)
  const config = useRuntimeConfig(event)
  const session = await useSession(event, { password: config.session.password })

  const { challenge: expectedChallenge, passkeyName } =
    session.data?.webAuthnLinkingData ?? {}

  if (!expectedChallenge || !passkeyName) {
    throw createError({
      statusCode: 400,
      message:
        'Session expired or is invalid. Please try adding the passkey again.',
    })
  }

  const verification = await verifyRegistrationResponse({
    response: attestation,
    expectedChallenge,
    expectedOrigin: config.public.webauthn.origin,
    expectedRPID: config.public.webauthn.rpID,
    requireUserVerification: true,
  })

  if (!verification.verified || !verification.registrationInfo) {
    throw createError({ statusCode: 400, message: 'Could not verify passkey.' })
  }

  const { credential } = verification.registrationInfo

  const passkey: InsertPasskey = {
    id: credential.id,
    userId: user.id,
    publicKey: Buffer.from(credential.publicKey).toString('base64url'),
    counter: credential.counter,
    name: passkeyName,
    backedUp: credential.backedUp || false,
    transports: credential.transports,
  }

  await createCredential(passkey)
  await session.update({ webAuthnLinkingData: undefined })

  return { ok: true }
})
