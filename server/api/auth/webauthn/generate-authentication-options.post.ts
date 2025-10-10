// server/api/auth/passkeys/generate-authentication-options.post.ts
import { useSession } from 'h3'
import { generateAuthenticationOptions } from '@simplewebauthn/server'
import { storeWebAuthnChallenge } from '@@/server/database/queries/passkeys'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)

  const options = await generateAuthenticationOptions({
    rpID: config.public.webauthn.rpID,
    userVerification: 'required',
  })

  const session = await useSession(event, { password: config.session.password })

  // 2. Update the session data with the challenge
  await session.update({
    webAuthnChallenge: options.challenge,
  })
  // setCookie(event, 'auth_challenge', sealedSession, {
  //   httpOnly: true, // Prevents client-side JS access
  //   secure: process.env.NODE_ENV === 'production', // Use true in production
  //   sameSite: 'strict',
  //   path: '/',
  //   maxAge: 60 * 5, // Expires in 5 minutes
  // })

  // Store the challenge for the verification step
  // await storeWebAuthnChallenge(options.challenge, options.challenge)

  return options
})
