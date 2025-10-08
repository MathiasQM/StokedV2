// server/api/auth/webauthn/verify-registration.post.ts

import { verifyRegistrationResponse } from '@simplewebauthn/server';
import type { VerifiedRegistrationResponse, RegistrationResponseJSON } from '@simplewebauthn/server/dist/esm/types';
import { getAndDeleteChallenge, createCredential } from '@@/server/database/queries/passkeys';
import { createUserWithPasskey } from '@@/server/database/queries/users';
import { sanitizeUser } from '@@/server/utils/auth';
import type { InsertPasskey } from '@@/types/database';

export default defineEventHandler(async (event) => {
  const body: RegistrationResponseJSON = await readBody(event);

  const config = useRuntimeConfig(event);
  const expectedOrigin = config.public.webauthn.origin; // Your custom domain
  const expectedRPID = config.public.webauthn.rpID;

  // 1. Get the challenge we stored earlier
  const expectedChallenge = await getAndDeleteChallenge(body.response.clientDataJSON);
  if (!expectedChallenge) {
    throw createError({ statusCode: 404, message: 'Challenge not found or expired.' });
  }

  let verification: VerifiedRegistrationResponse;
  try {
    // 2. **CRITICAL STEP**: Verify the authenticator response
    // We explicitly pass `expectedOrigin` and `expectedRPID`.
    verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin,
      expectedRPID,
      requireUserVerification: true,
    });
  } catch (error: any) {
    console.error('WebAuthn verification failed:', error);
    throw createError({ statusCode: 400, message: error.message });
  }

  const { verified, registrationInfo } = verification;

  if (verified && registrationInfo) {
    const { credentialPublicKey, credentialID, counter } = registrationInfo;
    const email = body.response.userHandle; // The email we used as userID

    if (!email) {
      throw createError({ statusCode: 400, message: 'User identifier missing from response.' });
    }

    // 3. Create the user in the database
    const newUser = await createUserWithPasskey({
      email,
      name: email.split('@')[0],
      emailVerified: true,
    });

    if (!newUser) {
      throw createError({ statusCode: 500, message: 'Failed to create user account.' });
    }

    // 4. Create the passkey credential linked to the new user
    const passkey: InsertPasskey = {
      id: Buffer.from(credentialID).toString('base64'), // Store as base64 string
      userId: newUser.id,
      publicKey: Buffer.from(credentialPublicKey), // Store as Buffer/bytea
      counter,
      name: 'Initial Passkey',
      backedUp: verification.registrationInfo?.credentialBackedUp || false,
      transports: body.response.transports ?? [],
    };
    await createCredential(passkey);

    // 5. Log the user in
    const transformedUser = sanitizeUser(newUser);
    await setUserSession(event, { user: transformedUser });

    return { ok: true, user: transformedUser };
  }

  throw createError({ statusCode: 400, message: 'Passkey verification failed.' });
});
