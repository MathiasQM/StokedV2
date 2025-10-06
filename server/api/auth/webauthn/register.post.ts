import {
  storeWebAuthnChallenge,
  getAndDeleteChallenge,
  createCredential,
} from '@@/server/database/queries/passkeys'
import {
  findUserByEmail,
  createUserWithPasskey,
} from '@@/server/database/queries/users' // We'll assume you have a createUser function
import type { InsertPasskey } from '@@/types/database'
import { emailSchema } from '@@/shared/validations/auth'
import { sanitizeUser } from '@@/server/utils/auth'

export default defineWebAuthnRegisterEventHandler({
  async getOptions(event, body) {
    const config = useRuntimeConfig(event)

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

  // 1. Validate the user input (just the email)
  async validateUser(userBody) {
    const { userName } = userBody
    const validation = emailSchema.safeParse({ email: userName })
    if (!validation.success) {
      throw createError({ statusCode: 400, message: 'Invalid email format' })
    }

    const existingUser = await findUserByEmail(validation.data.email)
    if (existingUser) {
      throw createError({
        statusCode: 409, // 409 Conflict is a good choice here
        message: 'An account with this email already exists.',
      })
    }

    // Pass the validated email along
    return {
      userName: validation.data.email,
      displayName: validation.data.email, // Use email as displayName for the passkey
    }
  },

  // 2. Store and retrieve the challenge (this logic remains the same)
  async storeChallenge(event, challenge, attemptId) {
    await storeWebAuthnChallenge(attemptId, challenge)
  },

  async getChallenge(event, attemptId) {
    const challenge = await getAndDeleteChallenge(attemptId)
    if (!challenge) {
      throw createError({
        statusCode: 404,
        message: 'Challenge not found or expired.',
      })
    }
    return challenge
  },

  // 3. On successful passkey creation, create the user and the credential
  async onSuccess(event, { credential, user }) {
    // Create the user in the database.
    // We'll set the name to be the email initially. They can change it later.
    const newUser = await createUserWithPasskey({
      email: user.userName,
      name: user.userName.split('@')[0], // A sensible default for the name
      emailVerified: true, // Passkey registration implies email control
    })

    if (!newUser) {
      throw createError({
        statusCode: 500,
        message: 'Failed to create user account.',
      })
    }

    // Now, create the passkey credential linked to this new user
    const passkey: InsertPasskey = {
      id: credential.id,
      name: 'Initial Passkey', // Give a default name for the first passkey
      userId: newUser.id,
      publicKey: credential.publicKey,
      counter: credential.counter,
      backedUp: credential.backedUp,
      transports: credential.transports,
    }
    await createCredential(passkey)

    // 4. Log the user in by setting the session
    const transformedUser = sanitizeUser(newUser)
    await setUserSession(event, { user: transformedUser })
  },
})
