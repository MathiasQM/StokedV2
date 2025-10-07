import {
  storeWebAuthnChallenge,
  getAndDeleteChallenge,
  createCredential,
} from '@@/server/database/queries/passkeys'
import type { InsertPasskey } from '@@/types/database'
import { linkPasskeySchema } from '@@/shared/validations/auth'

export default defineWebAuthnRegisterEventHandler({
  async getOptions(event, body) {
    const config = useRuntimeConfig(event)
    console.log({
      rpID: config.public.webauthn.rpID,
      expectedOrigin: config.public.webauthn.origin,
    })
    return {
      rpID: config.public.webauthn.rpID,
      expectedOrigin: config.public.webauthn.origin,
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        requireResidentKey: true,
        userVerification: 'required',
      },
      user: {
        id: body.user.userName,
        name: body.user.userName,
        displayName: body.user.userName,
      },
    }
  },

  async validateUser(userBody, event) {
    const session = await getUserSession(event)
    return linkPasskeySchema.parse(userBody)
  },

  async storeChallenge(event, challenge, attemptId) {
    await storeWebAuthnChallenge(attemptId, challenge)
  },

  async getChallenge(event, attemptId) {
    const challenge = await getAndDeleteChallenge(attemptId)
    if (!challenge)
      throw createError({ statusCode: 404, message: 'Challenge not found' })
    return challenge
  },

  async onSuccess(event, { credential, user }) {
    console.log('hit register event handler')
    const { user: sessionUser } = await requireUserSession(event)
    const passkey: InsertPasskey = {
      id: credential.id,
      name: user.displayName || 'Default Passkey',
      userId: sessionUser.id,
      publicKey: credential.publicKey,
      counter: credential.counter,
      backedUp: credential.backedUp,
      transports: credential.transports,
    }
    await createCredential(passkey)
  },
})
