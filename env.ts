import { createEnv } from '@t3-oss/env-nuxt'
import { z } from 'zod'

export const env = createEnv({
  server: {
    MOCK_EMAIL: z
      .string()
      .transform((val) => val === 'true')
      .pipe(z.boolean())
      .optional(),
    BASE_URL: z.string().url(),
    NODE_ENV: z.string(),
    APP_NAME: z.string(),
    APP_DESCRIPTION: z.string(),
    LOGO_URL: z.string().url(),
    RESEND_API_TOKEN: z.string().min(1),
    // NUXT_OAUTH_GITHUB_CLIENT_ID: z.string().min(1),
    // NUXT_OAUTH_GITHUB_CLIENT_SECRET: z.string().min(1),
    NUXT_OAUTH_GOOGLE_CLIENT_ID: z.string().min(1),
    NUXT_OAUTH_GOOGLE_CLIENT_SECRET: z.string().min(1),
    NUXT_SESSION_PASSWORD: z.string().min(32),
    NUXT_STRIPE_TEST_SECRET_KEY: z.string().min(1),
    NUXT_STRIPE_TEST_WEBHOOK_SECRET: z.string().min(1),
    // S3_ACCESS_KEY_ID: z.string().min(1).optional(),
    // S3_SECRET_ACCESS_KEY: z.string().min(1).optional(),
    // S3_BUCKET: z.string().min(1).optional(),
    // S3_REGION: z.string().min(1).optional(),
    // S3_ENDPOINT: z.string().min(1).optional(),
    // S3_PUBLIC_ENDPOINT: z.string().min(1).optional(),
    FROM_EMAIL: z.string().email(),
    EMAIL_PROVIDER: z.enum([
      'resend',
      'mailgun',
      'sendgrid',
      'postmark',
      'plunk',
    ]),
    PAYMENT_PROVIDER: z.enum(['stripe', 'lemonsqueezy']),
    // TWILIO_ACCOUNT_SID: z.string().min(1),
    // TWILIO_AUTH_TOKEN: z.string().min(1),
    // TWILIO_PHONE_NUMBER: z
    //   .string()
    //   .regex(
    //     /^\+[1-9]\d{1,14}$/,
    //     'Phone number must be in E.164 format (e.g. +12125551234)',
    //   ),
  },
})
