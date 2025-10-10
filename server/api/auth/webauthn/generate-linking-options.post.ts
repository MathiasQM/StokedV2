// server/api/passkeys/generate-linking-options.post.ts

import { generateRegistrationOptions } from '@simplewebauthn/server'
import {
  findCredentialByUserId,
  storeWebAuthnChallenge,
} from '@@/server/database/queries/passkeys'

export default defineEventHandler(async (event) => {
  // This endpoint is for logged-in users only
  const { user: sessionUser } = await requireUserSession(event)

  const config = useRuntimeConfig(event)

  // Find existing passkeys to prevent re-registering the same one
  const existingCredentials = await findCredentialByUserId(sessionUser.id)

  const options = await generateRegistrationOptions({
    rpID: config.public.webauthn.rpID,
    rpName: 'Striive AI', // Your app name
    userID: new TextEncoder().encode(sessionUser.id), // Use the stable user ID
    userName: sessionUser.email,
    excludeCredentials: existingCredentials.map((cred) => ({
      id: cred.id,
      type: 'public-key',
      transports: cred.transports as AuthenticatorTransport[],
    })),
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      requireResidentKey: true,
      userVerification: 'required',
    },
  })

  // Store the challenge, associating it with the logged-in user
  await storeWebAuthnChallenge(options.challenge, {
    challenge: options.challenge,
    // Storing the email isn't strictly necessary here since we have a session,
    // but it's good practice for consistency.
    email: sessionUser.email,
  })

  return options
})
