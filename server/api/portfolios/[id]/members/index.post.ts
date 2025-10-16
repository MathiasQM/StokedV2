import { validatePortfolioOwnership } from '@@/server/utils/portfolioValidation.ts'
import { invitePortfolioMemberSchema } from '@@/shared/validations/portfolio'
import { validateBody } from '@@/server/utils/bodyValidation'
import { findUserByEmail } from '@@/server/database/queries/users'
import {
  getActivePortfolioMembers,
  invitePortfolioMember,
} from '~~/server/database/queries/portfolios'
import { generateAlphaNumericCode } from '@@/server/utils/nanoid'
import { env } from '@@/env'
import { render } from '@vue-email/render'
import PortfolioInvitation from '@@/emails/member-invite.vue'
import { sendEmail } from '@@/server/services/email'
import { getSubscriptionByUserId } from '~~/server/database/queries/subscriptions'
import { checkLimit } from '~~/helpers/subscription-limits'

export default defineEventHandler(async (event) => {
  // 1. Validate portfolio ownership and get portfolio details
  const portfolioId = getRouterParam(event, 'id')
  if (!portfolioId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Portfolio ID is required',
    })
  }
  const { user, portfolio } = await validatePortfolioOwnership(
    event,
    portfolioId,
  )

  const portfolioMembers = await getActivePortfolioMembers(portfolioId)
  const sub = await getSubscriptionByUserId(user.id, { includeProduct: true })

  const { isAllowed } = checkLimit(
    sub?.price?.product?.id,
    'ownedPortfolios',
    portfolioMembers.length,
    sub?.plan,
  )

  if (!isAllowed) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You have reached the limit for portfolio members.',
    })
  }

  // 2. Validate request body
  const body = await validateBody(event, invitePortfolioMemberSchema)

  // 3. Check if user already exists
  const existingUser = await findUserByEmail(body.email.trim().toLowerCase())

  // 4. Generate invitation token
  const inviteToken = generateAlphaNumericCode(32)

  // 5. Create portfolio invitation
  const invitation = await invitePortfolioMember({
    portfolioId: portfolio.id,
    email: body.email,
    role: body.role || 'member',
    token: inviteToken,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
  })

  // 6. Send invitation email
  const htmlTemplate = await render(PortfolioInvitation, {
    organizationName: portfolio.name,
    inviterName: user.name,
    inviteLink: `${env.BASE_URL}/api/portfolios/verify-invite?token=${inviteToken}`,
  })

  if (env.MOCK_EMAIL) {
    console.table({
      email: body.email,
      portfolioName: portfolio.name,
      inviterName: user.name,
      inviteLink: `${env.BASE_URL}/api/portfolios/verify-invite?token=${inviteToken}`,
    })
  } else {
    await sendEmail({
      to: body.email,
      subject: `Invitation to join ${portfolio.name} on ${env.APP_NAME}`,
      html: htmlTemplate,
    })
  }

  setResponseStatus(event, 201)
  return invitation
})
