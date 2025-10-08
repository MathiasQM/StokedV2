// server/api/auth/webauthn/generate-registration-options.post.ts

import { generateRegistrationOptions } from '@simplewebauthn/server';
import { findUserByEmail } from '@@/server/database/queries/users';
import { storeWebAuthnChallenge } from '@@/server/database/queries/passkeys';
import { emailSchema } from '@@/shared/validations/auth';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { email } = body;

  // 1. Validate the user input
  const validation = emailSchema.safeParse({ email });
  if (!validation.success) {
    throw createError({ statusCode: 400, message: 'Invalid email format.' });
  }

  const existingUser = await findUserByEmail(validation.data.email);
  if (existingUser) {
    throw createError({
      statusCode: 409, // Conflict
      message: 'An account with this email already exists.',
    });
  }

  const config = useRuntimeConfig(event);
  const rpID = config.public.webauthn.rpID;
  const rpName = 'Striive'; // Set your Relying Party name here

  // 2. Generate registration options
  const options = await generateRegistrationOptions({
    rpID,
    rpName,
    userID: email, // Use email as a temporary, unique user ID for the ceremony
    userName: email,
    attestationType: 'none',
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      requireResidentKey: true,
      userVerification: 'required',
    },
  });

  // 3. Store the challenge for later verification
  // The attemptId can be the challenge itself or a generated UUID
  await storeWebAuthnChallenge(options.challenge, options.challenge);

  return options;
});
