import { sendEmail } from '@@/server/services/email'
import { render } from '@vue-email/render'
import LoginNotification from '@@/emails/login-notification.vue'
import { env } from '@@/env'

export default defineEventHandler(async (event) => {
  // Get user data from the request body
  const { user } = await readBody(event)
  if (!user?.name || !user?.email) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required user information',
    })
  }
  // 1. Try to get location from Cloudflare headers first
  let city = event.context.cf?.city
  let country = event.context.cf?.country

  // 2. If no country info, check for Google's header
  // 'x-country-code' is added by Google Cloud Run / Firebase App Hosting
  if (!country) {
    const countryCode = getRequestHeader(event, 'x-country-code')
    if (countryCode) {
      country = countryCode // This will be a two-letter code like 'US', 'DK', etc.
    }
  }

  // Only send email if we have location information
  try {
    const htmlTemplate = await render(LoginNotification, {
      userName: user.name,
      city: city || 'Unknown City',
      country: country || user.country || 'Unknown Country',
    })

    if (!env.MOCK_EMAIL) {
      await sendEmail({
        to: user.email,
        subject: 'Login from a new location',
        html: htmlTemplate,
      })
    }
    return { success: true }
  } catch (error) {
    console.error('Failed to send login notification email:', error)
    // Don't throw error as this is not critical
    return { success: false }
  }
})
