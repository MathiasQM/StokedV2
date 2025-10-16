import { sendEmail } from '@@/server/services/email'
import { render } from '@vue-email/render'
import LoginNotification from '@@/emails/login-notification.vue'
import { env } from '@@/env'
import { readGeoFromIp } from '~~/server/utils/ip'

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
  const geo = await readGeoFromIp(event)

  try {
    const htmlTemplate = await render(LoginNotification, {
      userName: user.name,
      city: geo.city || 'Unknown City',
      country: geo.country || user.country || 'Unknown Country',
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
