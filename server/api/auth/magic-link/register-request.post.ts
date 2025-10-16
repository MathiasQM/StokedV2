import { z } from 'zod'
import { findUserByEmail } from '@@/server/database/queries/users'
import { saveOneTimePassword } from '@@/server/database/queries/auth'
import { generateNumericCode } from '@@/server/utils/nanoid'
import { emailSchema } from '@@/shared/validations/auth'
import { validateBody } from '@@/server/utils/bodyValidation'
import { sendEmail } from '@@/server/services/email'
import { OneTimePasswordTypes } from '@@/constants'
import { env } from '@@/env'
import EmailVerification from '@@/emails/magic-link.vue'
import { render } from '@vue-email/render'

export default defineEventHandler(async (event) => {
  const data = await validateBody(event, emailSchema)

  const user = await findUserByEmail(data.email.trim().toLowerCase())
  if (user) {
    throw createError({
      statusCode: 409, // Conflict
      statusMessage: 'An account with this email already exists.',
    })
  }

  const oneTimePassword = generateNumericCode(6)

  await saveOneTimePassword({
    userId: null, // No user yet
    identifier: data.email,
    code: oneTimePassword,
    type: OneTimePasswordTypes.login,
    expiresAt: new Date(Date.now() + 1000 * 60 * 5), // 5 minutes
  })

  const emailHtml = await render(EmailVerification, {
    otp: oneTimePassword,
  })

  if (env.MOCK_EMAIL) {
    console.table({
      email: data.email,
      //   verificationLink: `${env.BASE_URL}/api/auth/verify-account?token=${emailVerificationCode}`,
      oneTimePassword,
    })
  } else {
    await sendEmail({
      subject: `Your login link for ${env.APP_NAME}`,
      to: data.email,
      html: emailHtml,
    })
  }

  return { message: 'A verification code has been sent to your email.' }
})
