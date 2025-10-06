import { render } from '@vue-email/render'
import PortfolioInvitation from '@@/emails/member-invite.vue'
import { sendEmail } from '@@/server/services/email'
import { env } from '@@/env'
import {
  findPortfolioInvite,
  updatePortfolioInvite,
} from '~~/server/database/queries/portfolios'

export default defineEventHandler(async (event) => {
  const portfolioId = getRouterParam(event, 'id')
  const inviteId = getRouterParam(event, 'inviteId')
  if (!portfolioId || !inviteId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Portfolio ID and invite ID are required',
    })
  }

  // Validate portfolio ownership and get portfolio and user details
  const { user, portfolio } = await validatePortfolioOwnership(
    event,
    portfolioId,
  )

  // Find the existing invitation
  const invitation = await findPortfolioInvite(inviteId)
  if (!invitation) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Invitation not found',
    })
  }

  // Update invitation expiry
  const updatedInvitation = await updatePortfolioInvite(inviteId, {
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
  })

  // Resend invitation email
  const htmlTemplate = await render(PortfolioInvitation, {
    organizationName: portfolio.name,
    inviterName: user.name,
    inviteLink: `${env.BASE_URL}/api/portfolios/verify-invite?token=${invitation.token}`,
  })

  if (env.MOCK_EMAIL) {
    console.table({
      email: invitation.email,
      portfolioName: portfolio.name,
      inviterName: user.name,
      inviteLink: `${env.BASE_URL}/api/portfolios/verify-invite?token=${invitation.token}`,
    })
  } else {
    await sendEmail({
      to: invitation.email,
      subject: `Invitation to join ${portfolio.name} on ${env.APP_NAME}`,
      html: htmlTemplate,
    })
  }

  return updatedInvitation
})
