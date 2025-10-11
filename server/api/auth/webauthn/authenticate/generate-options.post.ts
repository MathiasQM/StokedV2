import { useSession } from 'h3'
import { generateAuthenticationOptions } from '@simplewebauthn/server'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)

  const options = await generateAuthenticationOptions({
    rpID: config.public.webauthn.rpID,
    userVerification: 'required',
  })

  const session = await useSession(event, { password: config.session.password })

  await session.update({
    webAuthnChallenge: options.challenge,
  })

  return options
})
